from pydantic import BaseModel

from app.schemas.common import NonEmptyStr, ORMModel


class ChecklistItemCreate(BaseModel):
    text: NonEmptyStr
    done: bool = False


class ChecklistItemUpdate(BaseModel):
    text: NonEmptyStr | None = None
    done: bool | None = None
    position: float | None = None


class ChecklistItemRead(ORMModel):
    id: int
    issue_id: int
    text: str
    done: bool
    position: float
