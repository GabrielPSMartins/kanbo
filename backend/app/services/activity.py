from sqlalchemy.orm import Session

from app.models import ActivityAction, ActivityLog, Issue


def _fmt(value: object) -> str | None:
    if value is None:
        return None
    return str(value.value if hasattr(value, "value") else value)


def log(
    db: Session,
    issue: Issue,
    action: ActivityAction,
    from_value: object = None,
    to_value: object = None,
) -> ActivityLog:
    entry = ActivityLog(action=action.value, from_value=_fmt(from_value), to_value=_fmt(to_value))
    issue.activity.append(entry)
    db.add(entry)
    return entry
