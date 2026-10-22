from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AppError, NotFoundError
from app.models import (
    ActivityAction,
    Epic,
    Issue,
    IssueStatus,
    Label,
    Project,
    Sprint,
    SprintStatus,
)
from app.models.base import now
from app.repositories import issues as issue_repo
from app.repositories.base import get_or_404
from app.schemas.issue import IssueCreate, IssueMove, IssueUpdate
from app.services import activity

POSITION_STEP = 1024.0


def _validate_sprint(db: Session, project_id: int, sprint_id: int | None) -> Sprint | None:
    if sprint_id is None:
        return None
    sprint = db.get(Sprint, sprint_id)
    if sprint is None or sprint.project_id != project_id:
        raise NotFoundError(f"Sprint {sprint_id} não encontrada neste projeto")
    if sprint.status == SprintStatus.closed:
        raise AppError("Não é possível adicionar issues a uma sprint fechada", "sprint_closed")
    return sprint


def _validate_epic(db: Session, project_id: int, epic_id: int | None) -> None:
    if epic_id is None:
        return
    epic = db.get(Epic, epic_id)
    if epic is None or epic.project_id != project_id:
        raise NotFoundError(f"Epic {epic_id} não encontrado neste projeto")


def _load_labels(db: Session, project_id: int, label_ids: list[int]) -> list[Label]:
    ids = set(label_ids)
    labels = list(
        db.scalars(select(Label).where(Label.id.in_(ids), Label.project_id == project_id))
    )
    if len(labels) != len(ids):
        missing = ids - {lb.id for lb in labels}
        raise NotFoundError(f"Labels não encontradas: {sorted(missing)}")
    return labels


def end_position(db: Session, project_id: int, sprint_id: int | None) -> float:
    current = issue_repo.max_position(db, project_id, sprint_id)
    return (current or 0.0) + POSITION_STEP


def set_status(db: Session, issue: Issue, status: IssueStatus) -> None:
    if issue.status == status:
        return
    activity.log(db, issue, ActivityAction.status_changed, issue.status, status)
    issue.status = status
    issue.completed_at = now() if status == IssueStatus.done else None


def set_sprint(db: Session, issue: Issue, sprint_id: int | None, *, adjust_status: bool = True):
    """Troca a sprint da issue registrando atividade. Ajusta o status para manter
    coerência: ir para o backlog volta a `backlog`; entrar numa sprint sai de `backlog`."""
    if issue.sprint_id == sprint_id:
        return
    activity.log(db, issue, ActivityAction.moved_to_sprint, issue.sprint_id, sprint_id)
    issue.sprint_id = sprint_id
    if not adjust_status:
        return
    if sprint_id is None and issue.status != IssueStatus.done:
        set_status(db, issue, IssueStatus.backlog)
    elif sprint_id is not None and issue.status == IssueStatus.backlog:
        set_status(db, issue, IssueStatus.todo)


def create_issue(db: Session, project: Project, data: IssueCreate) -> Issue:
    _validate_sprint(db, project.id, data.sprint_id)
    _validate_epic(db, project.id, data.epic_id)
    labels = _load_labels(db, project.id, data.label_ids) if data.label_ids else []

    status = data.status or (IssueStatus.todo if data.sprint_id else IssueStatus.backlog)
    project.issue_counter += 1
    issue = Issue(
        project=project,
        number=project.issue_counter,
        title=data.title,
        description=data.description,
        type=data.type,
        status=status,
        priority=data.priority,
        story_points=data.story_points,
        sprint_id=data.sprint_id,
        epic_id=data.epic_id,
        due_date=data.due_date,
        position=end_position(db, project.id, data.sprint_id),
        labels=labels,
        completed_at=now() if status == IssueStatus.done else None,
    )
    db.add(issue)
    activity.log(db, issue, ActivityAction.created, None, issue.status)
    db.commit()
    return get_issue(db, issue.id)


def get_issue(db: Session, issue_id: int) -> Issue:
    issue = issue_repo.get_issue(db, issue_id)
    if issue is None:
        raise NotFoundError(f"Issue {issue_id} não encontrada")
    return issue


def get_issue_by_key(db: Session, key: str) -> Issue:
    issue = issue_repo.get_issue_by_key(db, key)
    if issue is None:
        raise NotFoundError(f"Issue {key} não encontrada")
    return issue


# campo simples -> ação registrada no histórico
_TRACKED_FIELDS = {
    "title": ActivityAction.title_changed,
    "description": ActivityAction.description_changed,
    "type": ActivityAction.type_changed,
    "priority": ActivityAction.priority_changed,
    "story_points": ActivityAction.points_changed,
    "epic_id": ActivityAction.epic_changed,
    "due_date": ActivityAction.due_date_changed,
}
_NOT_NULLABLE = {"title", "description", "type", "priority", "status"}


def update_issue(db: Session, issue_id: int, data: IssueUpdate) -> Issue:
    issue = get_issue(db, issue_id)
    fields = data.model_fields_set

    for name in fields & _NOT_NULLABLE:
        if getattr(data, name) is None:
            raise AppError(f"{name} não pode ser nulo", "validation_error", 422)

    if "epic_id" in fields:
        _validate_epic(db, issue.project_id, data.epic_id)

    for name, action in _TRACKED_FIELDS.items():
        if name not in fields:
            continue
        new = getattr(data, name)
        old = getattr(issue, name)
        if new == old:
            continue
        # descrição pode ser longa: o histórico só registra que mudou
        if name == "description":
            activity.log(db, issue, action)
        else:
            activity.log(db, issue, action, old, new)
        setattr(issue, name, new)

    if "sprint_id" in fields and data.sprint_id != issue.sprint_id:
        _validate_sprint(db, issue.project_id, data.sprint_id)
        set_sprint(db, issue, data.sprint_id, adjust_status="status" not in fields)
        issue.position = end_position(db, issue.project_id, data.sprint_id)

    if "status" in fields:
        set_status(db, issue, data.status)

    if "label_ids" in fields:
        labels = _load_labels(db, issue.project_id, data.label_ids or [])
        old_names = sorted(lb.name for lb in issue.labels)
        new_names = sorted(lb.name for lb in labels)
        if old_names != new_names:
            activity.log(
                db, issue, ActivityAction.labels_changed, ", ".join(old_names), ", ".join(new_names)
            )
            issue.labels = labels

    issue.updated_at = now()
    db.commit()
    return get_issue(db, issue.id)


def delete_issue(db: Session, issue_id: int) -> None:
    issue = get_or_404(db, Issue, issue_id, "Issue")
    db.delete(issue)
    db.commit()


MIN_GAP = 1e-6


def _neighbor(db: Session, issue: Issue, neighbor_id: int | None) -> Issue | None:
    if neighbor_id is None:
        return None
    if neighbor_id == issue.id:
        raise AppError("Uma issue não pode ser vizinha de si mesma", "invalid_move")
    other = db.get(Issue, neighbor_id)
    if other is None or other.project_id != issue.project_id:
        raise NotFoundError(f"Issue vizinha {neighbor_id} não encontrada")
    return other


def _renormalize(db: Session, project_id: int, sprint_id: int | None) -> None:
    """Redistribui as posições de uma seção (sprint ou backlog) em passos uniformes."""
    stmt = select(Issue).where(Issue.project_id == project_id)
    stmt = stmt.where(
        Issue.sprint_id.is_(None) if sprint_id is None else Issue.sprint_id == sprint_id
    )
    for i, item in enumerate(db.scalars(stmt.order_by(Issue.position, Issue.id)), start=1):
        item.position = i * POSITION_STEP
    db.flush()


def _position_between(before: Issue | None, after: Issue | None) -> float | None:
    """Posição entre os vizinhos; None se não houver espaço (precisa renormalizar)."""
    if before and after:
        lo, hi = before.position, after.position
        if hi - lo < MIN_GAP:
            return None
        return (lo + hi) / 2
    if before:
        return before.position + POSITION_STEP
    if after:
        return after.position - POSITION_STEP
    return None


def move_issue(db: Session, issue_id: int, data: IssueMove) -> Issue:
    """Drag-and-drop: muda status e/ou sprint e reposiciona entre `before_id` (acima)
    e `after_id` (abaixo). Position é float, então normalmente só a issue movida muda."""
    issue = get_issue(db, issue_id)
    fields = data.model_fields_set

    if "sprint_id" in fields and data.sprint_id != issue.sprint_id:
        _validate_sprint(db, issue.project_id, data.sprint_id)
        set_sprint(db, issue, data.sprint_id, adjust_status=data.status is None)
    if data.status is not None:
        set_status(db, issue, data.status)

    before = _neighbor(db, issue, data.before_id)
    after = _neighbor(db, issue, data.after_id)
    if before is None and after is None:
        issue.position = end_position(db, issue.project_id, issue.sprint_id)
    else:
        pos = _position_between(before, after)
        if pos is None:
            _renormalize(db, issue.project_id, issue.sprint_id)
            pos = _position_between(before, after)
        issue.position = pos

    issue.updated_at = now()
    db.commit()
    return get_issue(db, issue.id)
