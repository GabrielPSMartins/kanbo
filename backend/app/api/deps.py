from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Project
from app.repositories.base import get_or_404

DB = Annotated[Session, Depends(get_db)]


def get_project(project_id: int, db: DB) -> Project:
    return get_or_404(db, Project, project_id, "Projeto")


ProjectDep = Annotated[Project, Depends(get_project)]
