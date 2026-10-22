from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import now

if TYPE_CHECKING:
    from app.models.project import Project


class Epic(Base):
    __tablename__ = "epics"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(9), default="#6366F1")
    created_at: Mapped[datetime] = mapped_column(default=now)

    project: Mapped["Project"] = relationship(back_populates="epics")
