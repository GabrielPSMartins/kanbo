from datetime import datetime

from app.schemas.common import ORMModel


class ActivityRead(ORMModel):
    id: int
    issue_id: int
    action: str
    from_value: str | None
    to_value: str | None
    created_at: datetime
