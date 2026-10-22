from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.models.issue import Issue


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    issue_id: Mapped[int] = mapped_column(ForeignKey("issues.id", ondelete="CASCADE"), index=True)
    text: Mapped[str] = mapped_column(String(500))
    done: Mapped[bool] = mapped_column(default=False)
    position: Mapped[float] = mapped_column(default=0.0)

    issue: Mapped["Issue"] = relationship(back_populates="checklist")
