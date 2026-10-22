from enum import StrEnum


class SprintStatus(StrEnum):
    planned = "planned"
    active = "active"
    closed = "closed"


class IssueType(StrEnum):
    story = "story"
    task = "task"
    bug = "bug"
    research = "research"


class IssueStatus(StrEnum):
    backlog = "backlog"
    todo = "todo"
    in_progress = "in_progress"
    review = "review"
    done = "done"


class IssuePriority(StrEnum):
    urgent = "urgent"
    high = "high"
    medium = "medium"
    low = "low"
    none = "none"


class ActivityAction(StrEnum):
    created = "created"
    status_changed = "status_changed"
    moved_to_sprint = "moved_to_sprint"
    points_changed = "points_changed"
    priority_changed = "priority_changed"
    type_changed = "type_changed"
    title_changed = "title_changed"
    description_changed = "description_changed"
    epic_changed = "epic_changed"
    due_date_changed = "due_date_changed"
    labels_changed = "labels_changed"
