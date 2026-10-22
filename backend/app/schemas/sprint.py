from datetime import date, datetime
from typing import Literal, Self

from pydantic import BaseModel, model_validator

from app.models.enums import SprintStatus
from app.schemas.common import NonEmptyStr, ORMModel


class _DatesMixin(BaseModel):
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def _check_dates(self) -> Self:
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date deve ser igual ou posterior a start_date")
        return self


class SprintCreate(_DatesMixin):
    name: NonEmptyStr
    goal: str = ""


class SprintUpdate(_DatesMixin):
    name: NonEmptyStr | None = None
    goal: str | None = None


class SprintRead(ORMModel):
    id: int
    project_id: int
    name: str
    goal: str
    start_date: date | None
    end_date: date | None
    status: SprintStatus
    committed_points: int | None
    completed_points: int | None
    created_at: datetime
    started_at: datetime | None
    closed_at: datetime | None


class SprintWithStats(SprintRead):
    issue_count: int
    done_count: int
    total_points: int
    done_points: int


class SprintStart(BaseModel):
    start_date: date | None = None
    end_date: date | None = None


class SprintClose(BaseModel):
    move_to: Literal["backlog", "sprint"] = "backlog"
    target_sprint_id: int | None = None

    @model_validator(mode="after")
    def _check_target(self) -> Self:
        if self.move_to == "sprint" and self.target_sprint_id is None:
            raise ValueError("target_sprint_id é obrigatório quando move_to='sprint'")
        return self


class BurndownPoint(BaseModel):
    date: date
    ideal: float
    remaining: float | None


class Burndown(BaseModel):
    sprint_id: int
    committed_points: int
    points: list[BurndownPoint]
