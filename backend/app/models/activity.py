from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import now

if TYPE_CHECKING:
    from app.models.issue import Issue


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    issue_id: Mapped[int] = mapped_column(ForeignKey("issues.id", ondelete="CASCADE"), index=True)
    # Texto livre (ver ActivityAction) para não precisar de migration a cada ação nova
    action: Mapped[str] = mapped_column(String(40))
    from_value: Mapped[str | None] = mapped_column(String(500))
    to_value: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(default=now, index=True)

    issue: Mapped["Issue"] = relationship(back_populates="activity")
