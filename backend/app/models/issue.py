from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import now, str_enum
from app.models.enums import IssuePriority, IssueStatus, IssueType
from app.models.label import Label, issue_labels

if TYPE_CHECKING:
    from app.models.activity import ActivityLog
    from app.models.checklist import ChecklistItem
    from app.models.epic import Epic
    from app.models.project import Project
    from app.models.sprint import Sprint


class Issue(Base):
    __tablename__ = "issues"
    __table_args__ = (UniqueConstraint("project_id", "number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    number: Mapped[int]
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text, default="")
    type: Mapped[IssueType] = mapped_column(str_enum(IssueType), default=IssueType.task)
    status: Mapped[IssueStatus] = mapped_column(str_enum(IssueStatus), default=IssueStatus.backlog)
    priority: Mapped[IssuePriority] = mapped_column(
        str_enum(IssuePriority), default=IssuePriority.none
    )
    story_points: Mapped[int | None]
    sprint_id: Mapped[int | None] = mapped_column(
        ForeignKey("sprints.id", ondelete="SET NULL"), index=True
    )
    epic_id: Mapped[int | None] = mapped_column(
        ForeignKey("epics.id", ondelete="SET NULL"), index=True
    )
    due_date: Mapped[date | None]
    position: Mapped[float] = mapped_column(default=0.0)
    created_at: Mapped[datetime] = mapped_column(default=now)
    updated_at: Mapped[datetime] = mapped_column(default=now, onupdate=now)
    completed_at: Mapped[datetime | None]

    project: Mapped["Project"] = relationship(back_populates="issues")
    sprint: Mapped["Sprint | None"] = relationship(back_populates="issues")
    epic: Mapped["Epic | None"] = relationship()
    labels: Mapped[list[Label]] = relationship(secondary=issue_labels, order_by=Label.name)
    checklist: Mapped[list["ChecklistItem"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan", order_by="ChecklistItem.position"
    )
    activity: Mapped[list["ActivityLog"]] = relationship(
        back_populates="issue",
        cascade="all, delete-orphan",
        order_by="(ActivityLog.created_at, ActivityLog.id)",
    )

    @property
    def key(self) -> str:
        return f"{self.project.key}-{self.number}"

    @property
    def checklist_total(self) -> int:
        return len(self.checklist)

    @property
    def checklist_done(self) -> int:
        return sum(1 for item in self.checklist if item.done)
