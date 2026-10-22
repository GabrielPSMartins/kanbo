from fastapi import APIRouter

from app.api.v1.routers import (
    checklist,
    dashboard,
    epics,
    issues,
    labels,
    projects,
    sprints,
)

api_router = APIRouter(prefix="/api/v1")
for r in (projects, issues, checklist, sprints, epics, labels, dashboard):
    api_router.include_router(r.router)
