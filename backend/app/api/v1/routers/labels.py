from fastapi import APIRouter, status
from sqlalchemy import select

from app.api.deps import DB, ProjectDep
from app.core.errors import ConflictError
from app.models import Label
from app.repositories.base import get_or_404
from app.schemas.label import LabelCreate, LabelRead, LabelUpdate

router = APIRouter(tags=["labels"])


def _ensure_unique(db, project_id: int, name: str, exclude_id: int | None = None) -> None:
    stmt = select(Label.id).where(Label.project_id == project_id, Label.name == name)
    if exclude_id:
        stmt = stmt.where(Label.id != exclude_id)
    if db.scalar(stmt):
        raise ConflictError(f"Já existe uma label '{name}'", "duplicate_label")


@router.get("/projects/{project_id}/labels", response_model=list[LabelRead])
def list_labels(project: ProjectDep, db: DB):
    return list(
        db.scalars(select(Label).where(Label.project_id == project.id).order_by(Label.name))
    )


@router.post(
    "/projects/{project_id}/labels", response_model=LabelRead, status_code=status.HTTP_201_CREATED
)
def create_label(project: ProjectDep, data: LabelCreate, db: DB):
    _ensure_unique(db, project.id, data.name)
    label = Label(project_id=project.id, **data.model_dump())
    db.add(label)
    db.commit()
    return label


@router.patch("/labels/{label_id}", response_model=LabelRead)
def update_label(label_id: int, data: LabelUpdate, db: DB):
    label = get_or_404(db, Label, label_id, "Label")
    values = data.model_dump(exclude_unset=True, exclude_none=True)
    if "name" in values:
        _ensure_unique(db, label.project_id, values["name"], label.id)
    for k, v in values.items():
        setattr(label, k, v)
    db.commit()
    return label


@router.delete("/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_label(label_id: int, db: DB):
    db.delete(get_or_404(db, Label, label_id, "Label"))
    db.commit()
