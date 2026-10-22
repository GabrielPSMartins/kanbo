from datetime import date

from pydantic import BaseModel

from app.models.enums import IssueStatus
from app.schemas.issue import IssueRead


class ActiveSprintSummary(BaseModel):
    id: int
    name: str
    goal: str
    start_date: date | None
    end_date: date | None
    days_remaining: int | None
    total_points: int
    done_points: int
    progress: float  # 0..1 (pontos concluídos / total)
    issue_count: int
    done_count: int


class VelocityEntry(BaseModel):
    sprint_id: int
    name: str
    committed: int
    completed: int


class Dashboard(BaseModel):
    active_sprint: ActiveSprintSummary | None
    # contagem por status: da sprint ativa e do projeto todo
    sprint_status_counts: dict[IssueStatus, int]
    project_status_counts: dict[IssueStatus, int]
    velocity: list[VelocityEntry]  # últimas 5 sprints fechadas, da mais antiga p/ a mais recente
    average_velocity: float | None
    due_soon: list[IssueRead]  # não concluídas com prazo vencido ou nos próximos 7 dias
    in_progress: list[IssueRead]
