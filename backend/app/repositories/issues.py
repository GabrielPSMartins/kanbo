from dataclasses import dataclass

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session, selectinload

from app.models import Issue, IssuePriority, IssueStatus, IssueType, Project, issue_labels


@dataclass
class IssueFilters:
    # sprint_id: None = não filtra; "backlog" = só issues sem sprint
    sprint_id: int | str | None = None
    status: list[IssueStatus] | None = None
    type: list[IssueType] | None = None
    priority: list[IssuePriority] | None = None
    epic_id: int | None = None
    label_id: int | None = None
    q: str | None = None


def base_query() -> Select[tuple[Issue]]:
    return select(Issue).options(
        selectinload(Issue.labels),
        selectinload(Issue.checklist),
        selectinload(Issue.project),
    )


def _apply_filters(stmt: Select, project_id: int, f: IssueFilters) -> Select:
    stmt = stmt.where(Issue.project_id == project_id)
    if f.sprint_id == "backlog":
        stmt = stmt.where(Issue.sprint_id.is_(None))
    elif f.sprint_id is not None:
        stmt = stmt.where(Issue.sprint_id == int(f.sprint_id))
    if f.status:
        stmt = stmt.where(Issue.status.in_(f.status))
    if f.type:
        stmt = stmt.where(Issue.type.in_(f.type))
    if f.priority:
        stmt = stmt.where(Issue.priority.in_(f.priority))
    if f.epic_id is not None:
        stmt = stmt.where(Issue.epic_id == f.epic_id)
    if f.label_id is not None:
        stmt = stmt.where(
            Issue.id.in_(
                select(issue_labels.c.issue_id).where(issue_labels.c.label_id == f.label_id)
            )
        )
    if f.q:
        term = f.q.strip()
        cond = Issue.title.ilike(f"%{term}%")
        # Permite buscar pela key ("TCC-12") ou só pelo número ("12")
        num = term.rsplit("-", 1)[-1]
        if num.isdigit():
            cond = cond | (Issue.number == int(num))
        stmt = stmt.where(cond)
    return stmt


def list_issues(
    db: Session, project_id: int, f: IssueFilters, limit: int, offset: int
) -> tuple[list[Issue], int]:
    total = db.scalar(_apply_filters(select(func.count(Issue.id)), project_id, f)) or 0
    stmt = (
        _apply_filters(base_query(), project_id, f)
        .order_by(Issue.position, Issue.id)
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(stmt)), total


def get_issue(db: Session, issue_id: int) -> Issue | None:
    return db.scalar(
        base_query().where(Issue.id == issue_id).execution_options(populate_existing=True)
    )


def get_issue_by_key(db: Session, key: str) -> Issue | None:
    prefix, _, number = key.upper().rpartition("-")
    if not prefix or not number.isdigit():
        return None
    return db.scalar(
        base_query().join(Project).where(Project.key == prefix, Issue.number == int(number))
    )


def max_position(db: Session, project_id: int, sprint_id: int | None) -> float | None:
    stmt = select(func.max(Issue.position)).where(Issue.project_id == project_id)
    stmt = stmt.where(
        Issue.sprint_id.is_(None) if sprint_id is None else Issue.sprint_id == sprint_id
    )
    return db.scalar(stmt)
