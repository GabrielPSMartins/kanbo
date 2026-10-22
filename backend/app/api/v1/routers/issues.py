from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import DB, ProjectDep
from app.models import IssuePriority, IssueStatus, IssueType
from app.repositories import issues as issue_repo
from app.repositories.issues import IssueFilters
from app.schemas.activity import ActivityRead
from app.schemas.common import Page
from app.schemas.issue import IssueCreate, IssueDetail, IssueMove, IssueRead, IssueUpdate
from app.services import issue_service

router = APIRouter(tags=["issues"])


@router.get("/projects/{project_id}/issues", response_model=Page[IssueRead])
def list_issues(
    project: ProjectDep,
    db: DB,
    sprint_id: int | None = None,
    in_backlog: Annotated[bool, Query(description="Só issues sem sprint")] = False,
    status: Annotated[list[IssueStatus] | None, Query()] = None,
    type: Annotated[list[IssueType] | None, Query()] = None,
    priority: Annotated[list[IssuePriority] | None, Query()] = None,
    epic_id: int | None = None,
    label_id: int | None = None,
    q: str | None = None,
    limit: Annotated[int, Query(ge=1, le=1000)] = 500,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    filters = IssueFilters(
        sprint_id="backlog" if in_backlog else sprint_id,
        status=status,
        type=type,
        priority=priority,
        epic_id=epic_id,
        label_id=label_id,
        q=q,
    )
    items, total = issue_repo.list_issues(db, project.id, filters, limit, offset)
    return Page[IssueRead](
        items=[IssueRead.model_validate(i) for i in items], total=total, limit=limit, offset=offset
    )


@router.post(
    "/projects/{project_id}/issues", response_model=IssueDetail, status_code=status.HTTP_201_CREATED
)
def create_issue(project: ProjectDep, data: IssueCreate, db: DB):
    return issue_service.create_issue(db, project, data)


@router.get("/issues/by-key/{key}", response_model=IssueDetail)
def get_issue_by_key(key: str, db: DB):
    return issue_service.get_issue_by_key(db, key)


@router.get("/issues/{issue_id}", response_model=IssueDetail)
def get_issue(issue_id: int, db: DB):
    return issue_service.get_issue(db, issue_id)


@router.patch("/issues/{issue_id}", response_model=IssueDetail)
def update_issue(issue_id: int, data: IssueUpdate, db: DB):
    return issue_service.update_issue(db, issue_id, data)


@router.post("/issues/{issue_id}/move", response_model=IssueDetail)
def move_issue(issue_id: int, data: IssueMove, db: DB):
    return issue_service.move_issue(db, issue_id, data)


@router.delete("/issues/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(issue_id: int, db: DB):
    issue_service.delete_issue(db, issue_id)


@router.get("/issues/{issue_id}/activity", response_model=list[ActivityRead])
def get_activity(issue_id: int, db: DB):
    return issue_service.get_issue(db, issue_id).activity
