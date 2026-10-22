from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models import Project, Sprint, SprintStatus
from app.repositories import sprints as sprint_repo
from app.repositories.base import get_or_404
from app.schemas.sprint import SprintCreate, SprintUpdate, SprintWithStats
from app.services.issue_service import set_sprint

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
