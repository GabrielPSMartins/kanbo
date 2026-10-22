from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import now, str_enum
from app.models.enums import SprintStatus

if TYPE_CHECKING:
    from app.models.issue import Issue
    from app.models.project import Project


class Sprint(Base):
    __tablename__ = "sprints"
    __table_args__ = (
        # Garante no banco a regra "só uma sprint ativa por projeto"
        Index(
            "uq_sprints_one_active_per_project",
            "project_id",
            unique=True,
            sqlite_where=text("status = 'active'"),
            postgresql_where=text("status = 'active'"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    goal: Mapped[str] = mapped_column(Text, default="")
    start_date: Mapped[date | None]
    end_date: Mapped[date | None]
    status: Mapped[SprintStatus] = mapped_column(
        str_enum(SprintStatus), default=SprintStatus.planned
    )
    # Snapshots: pontos na sprint ao iniciar e pontos concluídos ao fechar
    committed_points: Mapped[int | None]
    completed_points: Mapped[int | None]
    created_at: Mapped[datetime] = mapped_column(default=now)
    started_at: Mapped[datetime | None]
    closed_at: Mapped[datetime | None]

    project: Mapped["Project"] = relationship(back_populates="sprints")
    issues: Mapped[list["Issue"]] = relationship(back_populates="sprint")
