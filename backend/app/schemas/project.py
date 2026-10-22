from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.schemas.common import HexColor, NonEmptyStr, ORMModel

ProjectKey = Annotated[
    str,
    StringConstraints(strip_whitespace=True, to_upper=True, pattern=r"^[A-Za-z][A-Za-z0-9]{1,9}$"),
]


class ProjectCreate(BaseModel):
    name: NonEmptyStr
    key: ProjectKey
    description: str = ""
    color: HexColor = "#6366F1"


class ProjectUpdate(BaseModel):
    name: NonEmptyStr | None = None
    key: ProjectKey | None = None
    description: str | None = None
    color: HexColor | None = None


class ProjectRead(ORMModel):
    id: int
    name: str
    key: str
    description: str
    color: str
    created_at: datetime
