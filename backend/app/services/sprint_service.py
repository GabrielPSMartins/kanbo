from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.core.errors import AppError, ConflictError, NotFoundError
from app.models import IssueStatus, Project, Sprint, SprintStatus
from app.models.base import now
from app.repositories import sprints as sprint_repo
from app.repositories.base import get_or_404
from app.schemas.sprint import SprintClose, SprintCreate, SprintStart, SprintUpdate, SprintWithStats
from app.services.issue_service import end_position, set_sprint, set_status

DEFAULT_SPRINT_DAYS = 14

_EMPTY_STATS = {"issue_count": 0, "done_count": 0, "total_points": 0, "done_points": 0}


def with_stats(db: Session, sprints: list[Sprint]) -> list[SprintWithStats]:
    stats = sprint_repo.stats_by_sprint(db, [s.id for s in sprints])
    return [
        SprintWithStats.model_validate({**_sprint_dict(s), **stats.get(s.id, _EMPTY_STATS)})
        for s in sprints
    ]


def _sprint_dict(s: Sprint) -> dict:
    return {c.key: getattr(s, c.key) for c in Sprint.__table__.columns}


def create_sprint(db: Session, project: Project, data: SprintCreate) -> Sprint:
    sprint = Sprint(project_id=project.id, **data.model_dump())
    db.add(sprint)
    db.commit()
    return sprint


def update_sprint(db: Session, sprint_id: int, data: SprintUpdate) -> Sprint:
    sprint = get_or_404(db, Sprint, sprint_id, "Sprint")
    values = data.model_dump(exclude_unset=True)
    if values.get("name", "") is None:
        values.pop("name")
    if values.get("goal", "") is None:
        values["goal"] = ""
    for k, v in values.items():
        setattr(sprint, k, v)
    if sprint.start_date and sprint.end_date and sprint.end_date < sprint.start_date:
        raise AppError("end_date deve ser igual ou posterior a start_date", "validation_error", 422)
    db.commit()
    return sprint


def delete_sprint(db: Session, sprint_id: int) -> None:
    sprint = get_or_404(db, Sprint, sprint_id, "Sprint")
    if sprint.status == SprintStatus.active:
        raise AppError("Conclua a sprint ativa antes de excluí-la", "sprint_active")
    # issues da sprint voltam ao backlog; feito aqui (e não via ON DELETE SET NULL)
    # para registrar atividade
    for issue in list(sprint.issues):
        set_sprint(db, issue, None)
    db.delete(sprint)
    db.commit()


def start_sprint(db: Session, sprint_id: int, data: SprintStart) -> Sprint:
    sprint = get_or_404(db, Sprint, sprint_id, "Sprint")
    if sprint.status != SprintStatus.planned:
        raise AppError("Só é possível iniciar uma sprint planejada", "sprint_not_planned")
    active = sprint_repo.get_active(db, sprint.project_id)
    if active is not None:
        raise ConflictError(
            f"Já existe uma sprint ativa ({active.name}). Conclua-a antes de iniciar outra.",
            "sprint_already_active",
        )

    sprint.start_date = data.start_date or sprint.start_date or date.today()
    sprint.end_date = data.end_date or sprint.end_date
    if sprint.end_date is None or sprint.end_date < sprint.start_date:
        sprint.end_date = sprint.start_date + timedelta(days=DEFAULT_SPRINT_DAYS - 1)

    for issue in sprint.issues:
        if issue.status == IssueStatus.backlog:
            set_status(db, issue, IssueStatus.todo)
    sprint.committed_points = sum(i.story_points or 0 for i in sprint.issues)
    sprint.status = SprintStatus.active
    sprint.started_at = now()
    db.commit()
    return sprint


def close_sprint(db: Session, sprint_id: int, data: SprintClose) -> Sprint:
    """Fecha a sprint ativa. Issues concluídas ficam nela (histórico); as pendentes
    vão para o backlog ou para outra sprint planejada, conforme `data.move_to`."""
    sprint = get_or_404(db, Sprint, sprint_id, "Sprint")
    if sprint.status != SprintStatus.active:
        raise AppError("Só é possível concluir a sprint ativa", "sprint_not_active")

    target_id: int | None = None
    if data.move_to == "sprint":
        target = db.get(Sprint, data.target_sprint_id)
        if target is None or target.project_id != sprint.project_id:
            raise NotFoundError(f"Sprint {data.target_sprint_id} não encontrada neste projeto")
        if target.status != SprintStatus.planned or target.id == sprint.id:
            raise AppError("O destino deve ser uma sprint planejada", "invalid_target_sprint")
        target_id = target.id

    issues = sorted(sprint.issues, key=lambda i: i.position)
    done = [i for i in issues if i.status == IssueStatus.done]
    pending = [i for i in issues if i.status != IssueStatus.done]

    position = end_position(db, sprint.project_id, target_id)
    for issue in pending:
        set_sprint(db, issue, target_id)
        issue.position = position
        position += 1024

    sprint.completed_points = sum(i.story_points or 0 for i in done)
    sprint.status = SprintStatus.closed
    sprint.closed_at = now()
    db.commit()
    return sprint
