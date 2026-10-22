from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Project


def list_projects(db: Session) -> list[Project]:
    return list(db.scalars(select(Project).order_by(Project.created_at, Project.id)))


def get_by_key(db: Session, key: str) -> Project | None:
    return db.scalar(select(Project).where(Project.key == key.upper()))
