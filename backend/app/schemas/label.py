from pydantic import BaseModel

from app.schemas.common import HexColor, NonEmptyStr, ORMModel


class LabelCreate(BaseModel):
    name: NonEmptyStr
    color: HexColor = "#6B7280"


class LabelUpdate(BaseModel):
    name: NonEmptyStr | None = None
    color: HexColor | None = None


class LabelRead(ORMModel):
    id: int
    project_id: int
    name: str
    color: str
