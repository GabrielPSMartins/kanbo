from fastapi import APIRouter, status

from app.api.deps import DB, ProjectDep
from app.models import Sprint, SprintStatus
from app.repositories import sprints as sprint_repo
from app.repositories.base import get_or_404
from app.schemas.sprint import SprintCreate, SprintUpdate, SprintWithStats
from app.services import sprint_service

router = APIRouter(tags=["sprints"])


@router.get("/projects/{project_id}/sprints", response_model=list[SprintWithStats])
def list_sprints(project: ProjectDep, db: DB, status: SprintStatus | None = None):
    return sprint_service.with_stats(db, sprint_repo.list_sprints(db, project.id, status))


@router.post(
    "/projects/{project_id}/sprints",
    response_model=SprintWithStats,
    status_code=status.HTTP_201_CREATED,
)
def create_sprint(project: ProjectDep, data: SprintCreate, db: DB):
    sprint = sprint_service.create_sprint(db, project, data)
    return sprint_service.with_stats(db, [sprint])[0]


@router.get("/sprints/{sprint_id}", response_model=SprintWithStats)
def get_sprint(sprint_id: int, db: DB):
    return sprint_service.with_stats(db, [get_or_404(db, Sprint, sprint_id, "Sprint")])[0]


@router.patch("/sprints/{sprint_id}", response_model=SprintWithStats)
def update_sprint(sprint_id: int, data: SprintUpdate, db: DB):
    sprint = sprint_service.update_sprint(db, sprint_id, data)
    return sprint_service.with_stats(db, [sprint])[0]


@router.delete("/sprints/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sprint(sprint_id: int, db: DB):
    sprint_service.delete_sprint(db, sprint_id)
