from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import now

if TYPE_CHECKING:
    from app.models.epic import Epic
    from app.models.issue import Issue
    from app.models.label import Label
    from app.models.sprint import Sprint


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    key: Mapped[str] = mapped_column(String(10), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(9), default="#6366F1")
    # Último número de issue emitido; incrementado na criação para gerar TCC-1, TCC-2...
    issue_counter: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(default=now)

    epics: Mapped[list["Epic"]] = relationship(back_populates="project", cascade="all, delete")
    sprints: Mapped[list["Sprint"]] = relationship(back_populates="project", cascade="all, delete")
    issues: Mapped[list["Issue"]] = relationship(back_populates="project", cascade="all, delete")
    labels: Mapped[list["Label"]] = relationship(back_populates="project", cascade="all, delete")
