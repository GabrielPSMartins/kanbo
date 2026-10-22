from fastapi import APIRouter

from app.api.v1.routers import checklist, epics, issues, labels, projects, sprints

api_router = APIRouter(prefix="/api/v1")
for r in (projects, issues, checklist, sprints, epics, labels):
    api_router.include_router(r.router)
