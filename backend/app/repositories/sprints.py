from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models import Issue, IssueStatus, Sprint, SprintStatus

_STATUS_ORDER = case(
    {SprintStatus.active: 0, SprintStatus.planned: 1, SprintStatus.closed: 2},
    value=Sprint.status,
)


def list_sprints(db: Session, project_id: int, status: SprintStatus | None = None) -> list[Sprint]:
    stmt = select(Sprint).where(Sprint.project_id == project_id)
    if status:
        stmt = stmt.where(Sprint.status == status)
    # ativa primeiro, depois planejadas (ordem de criação), depois fechadas (mais recente primeiro)
    stmt = stmt.order_by(
        _STATUS_ORDER,
        case((Sprint.status == SprintStatus.closed, -Sprint.id), else_=Sprint.id),
    )
    return list(db.scalars(stmt))


def get_active(db: Session, project_id: int) -> Sprint | None:
    return db.scalar(
        select(Sprint).where(Sprint.project_id == project_id, Sprint.status == SprintStatus.active)
    )


def stats_by_sprint(db: Session, sprint_ids: list[int]) -> dict[int, dict[str, int]]:
    if not sprint_ids:
        return {}
    is_done = Issue.status == IssueStatus.done
    pts = func.coalesce(Issue.story_points, 0)
    rows = db.execute(
        select(
            Issue.sprint_id,
            func.count(Issue.id),
            func.sum(case((is_done, 1), else_=0)),
            func.sum(pts),
            func.sum(case((is_done, pts), else_=0)),
        )
        .where(Issue.sprint_id.in_(sprint_ids))
        .group_by(Issue.sprint_id)
    )
    return {
        sid: {
            "issue_count": c or 0,
            "done_count": d or 0,
            "total_points": tp or 0,
            "done_points": dp or 0,
        }
        for sid, c, d, tp, dp in rows
    }
