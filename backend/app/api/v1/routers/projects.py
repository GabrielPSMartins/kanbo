from fastapi import APIRouter, status

from app.api.deps import DB, ProjectDep
from app.repositories import projects as project_repo
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
def list_projects(db: DB):
    return project_repo.list_projects(db)


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate, db: DB):
    return project_service.create_project(db, data)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project: ProjectDep):
    return project


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, data: ProjectUpdate, db: DB):
    return project_service.update_project(db, project_id, data)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project: ProjectDep, db: DB):
    db.delete(project)
    db.commit()
