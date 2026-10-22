from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import HexColor, NonEmptyStr, ORMModel


class EpicCreate(BaseModel):
    title: NonEmptyStr
    description: str = ""
    color: HexColor = "#6366F1"


class EpicUpdate(BaseModel):
    title: NonEmptyStr | None = None
    description: str | None = None
    color: HexColor | None = None


class EpicRead(ORMModel):
    id: int
    project_id: int
    title: str
    description: str
    color: str
    created_at: datetime


class EpicWithProgress(EpicRead):
    issue_count: int
    done_count: int
    total_points: int
    done_points: int
