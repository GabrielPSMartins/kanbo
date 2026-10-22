from fastapi import APIRouter, status
from sqlalchemy import func, select

from app.api.deps import DB
from app.core.errors import NotFoundError
from app.models import ChecklistItem, Issue
from app.models.base import now
from app.repositories.base import get_or_404
from app.schemas.checklist import ChecklistItemCreate, ChecklistItemRead, ChecklistItemUpdate

router = APIRouter(prefix="/issues/{issue_id}/checklist", tags=["checklist"])


def _get_item(db, issue_id: int, item_id: int) -> ChecklistItem:
    item = db.get(ChecklistItem, item_id)
    if item is None or item.issue_id != issue_id:
        raise NotFoundError(f"Item {item_id} não encontrado")
    return item


@router.get("", response_model=list[ChecklistItemRead])
def list_items(issue_id: int, db: DB):
    return get_or_404(db, Issue, issue_id, "Issue").checklist


@router.post("", response_model=ChecklistItemRead, status_code=status.HTTP_201_CREATED)
def create_item(issue_id: int, data: ChecklistItemCreate, db: DB):
    issue = get_or_404(db, Issue, issue_id, "Issue")
    last = db.scalar(
        select(func.max(ChecklistItem.position)).where(ChecklistItem.issue_id == issue_id)
    )
    item = ChecklistItem(issue_id=issue_id, position=(last or 0) + 1024, **data.model_dump())
    db.add(item)
    issue.updated_at = now()
    db.commit()
    return item


@router.patch("/{item_id}", response_model=ChecklistItemRead)
def update_item(issue_id: int, item_id: int, data: ChecklistItemUpdate, db: DB):
    item = _get_item(db, issue_id, item_id)
    for k, v in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(item, k, v)
    item.issue.updated_at = now()
    db.commit()
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(issue_id: int, item_id: int, db: DB):
    item = _get_item(db, issue_id, item_id)
    db.delete(item)
    db.commit()
