from datetime import date, datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel

from app.models.enums import IssuePriority, IssueStatus, IssueType
from app.schemas.activity import ActivityRead
from app.schemas.checklist import ChecklistItemRead
from app.schemas.common import NonEmptyStr, ORMModel
from app.schemas.label import LabelRead

FIBONACCI = (1, 2, 3, 5, 8, 13)


def _check_points(v: int | None) -> int | None:
    if v is not None and v not in FIBONACCI:
        raise ValueError(f"story_points deve ser um de {FIBONACCI}")
    return v


StoryPoints = Annotated[int | None, AfterValidator(_check_points)]


class IssueCreate(BaseModel):
    title: NonEmptyStr
    description: str = ""
    type: IssueType = IssueType.task
    status: IssueStatus | None = None  # default: todo se em sprint, backlog caso contrário
    priority: IssuePriority = IssuePriority.none
    story_points: StoryPoints = None
    sprint_id: int | None = None
    epic_id: int | None = None
    due_date: date | None = None
    label_ids: list[int] = []


class IssueUpdate(BaseModel):
    """PATCH: só os campos enviados são alterados (inclusive null explícito)."""

    title: NonEmptyStr | None = None
    description: str | None = None
    type: IssueType | None = None
    status: IssueStatus | None = None
    priority: IssuePriority | None = None
    story_points: StoryPoints = None
    sprint_id: int | None = None
    epic_id: int | None = None
    due_date: date | None = None
    label_ids: list[int] | None = None


class IssueMove(BaseModel):
    """Drag-and-drop. sprint_id só é aplicado se enviado (null = backlog)."""

    status: IssueStatus | None = None
    sprint_id: int | None = None
    before_id: int | None = None  # issue que fica imediatamente ACIMA após o drop
    after_id: int | None = None  # issue que fica imediatamente ABAIXO após o drop


class IssueRead(ORMModel):
    id: int
    project_id: int
    number: int
    key: str
    title: str
    description: str
    type: IssueType
    status: IssueStatus
    priority: IssuePriority
    story_points: int | None
    sprint_id: int | None
    epic_id: int | None
    due_date: date | None
    position: float
    labels: list[LabelRead]
    checklist_total: int
    checklist_done: int
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None


class IssueDetail(IssueRead):
    checklist: list[ChecklistItemRead]
    activity: list[ActivityRead]
