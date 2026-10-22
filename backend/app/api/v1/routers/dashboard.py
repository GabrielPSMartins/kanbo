from fastapi import APIRouter

from app.api.deps import DB, ProjectDep
from app.schemas.dashboard import Dashboard
from app.services.dashboard import build_dashboard

router = APIRouter(tags=["dashboard"])


@router.get("/projects/{project_id}/dashboard", response_model=Dashboard)
def get_dashboard(project: ProjectDep, db: DB):
    return build_dashboard(db, project)
