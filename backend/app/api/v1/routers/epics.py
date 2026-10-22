from fastapi import APIRouter, status
from sqlalchemy import case, func, select

from app.api.deps import DB, ProjectDep
from app.models import Epic, Issue, IssueStatus
from app.repositories.base import get_or_404
from app.schemas.epic import EpicCreate, EpicRead, EpicUpdate, EpicWithProgress

router = APIRouter(tags=["epics"])


@router.get("/projects/{project_id}/epics", response_model=list[EpicWithProgress])
def list_epics(project: ProjectDep, db: DB):
    is_done = Issue.status == IssueStatus.done
    pts = func.coalesce(Issue.story_points, 0)
    rows = db.execute(
        select(
            Epic,
            func.count(Issue.id),
            func.coalesce(func.sum(case((is_done, 1), else_=0)), 0),
            func.coalesce(func.sum(pts), 0),
            func.coalesce(func.sum(case((is_done, pts), else_=0)), 0),
        )
        .outerjoin(Issue, Issue.epic_id == Epic.id)
        .where(Epic.project_id == project.id)
        .group_by(Epic.id)
        .order_by(Epic.created_at, Epic.id)
    )
    return [
        EpicWithProgress(
            **EpicRead.model_validate(epic).model_dump(),
            issue_count=count,
            done_count=done,
            total_points=total_pts,
            done_points=done_pts,
        )
        for epic, count, done, total_pts, done_pts in rows
    ]


@router.post(
    "/projects/{project_id}/epics", response_model=EpicRead, status_code=status.HTTP_201_CREATED
)
def create_epic(project: ProjectDep, data: EpicCreate, db: DB):
    epic = Epic(project_id=project.id, **data.model_dump())
    db.add(epic)
    db.commit()
    return epic


@router.get("/epics/{epic_id}", response_model=EpicRead)
def get_epic(epic_id: int, db: DB):
    return get_or_404(db, Epic, epic_id, "Epic")


@router.patch("/epics/{epic_id}", response_model=EpicRead)
def update_epic(epic_id: int, data: EpicUpdate, db: DB):
    epic = get_or_404(db, Epic, epic_id, "Epic")
    for k, v in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(epic, k, v)
    db.commit()
    return epic


@router.delete("/epics/{epic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_epic(epic_id: int, db: DB):
    db.delete(get_or_404(db, Epic, epic_id, "Epic"))
    db.commit()
