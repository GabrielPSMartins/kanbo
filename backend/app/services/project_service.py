from sqlalchemy.orm import Session

from app.core.errors import ConflictError
from app.models import Project
from app.repositories import projects as project_repo
from app.repositories.base import get_or_404
from app.schemas.project import ProjectCreate, ProjectUpdate


def create_project(db: Session, data: ProjectCreate) -> Project:
    if project_repo.get_by_key(db, data.key):
        raise ConflictError(f"Já existe um projeto com a key {data.key}", "duplicate_key")
    project = Project(**data.model_dump())
    db.add(project)
    db.commit()
    return project


def update_project(db: Session, project_id: int, data: ProjectUpdate) -> Project:
    project = get_or_404(db, Project, project_id, "Projeto")
    values = data.model_dump(exclude_unset=True, exclude_none=True)
    new_key = values.get("key")
    if new_key and new_key != project.key and project_repo.get_by_key(db, new_key):
        raise ConflictError(f"Já existe um projeto com a key {values['key']}", "duplicate_key")
    for k, v in values.items():
        setattr(project, k, v)
    db.commit()
    return project
