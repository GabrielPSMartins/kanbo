from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Issue, IssueStatus, Project, Sprint, SprintStatus
from app.repositories import issues as issue_repo
from app.repositories import sprints as sprint_repo
from app.schemas.dashboard import ActiveSprintSummary, Dashboard, VelocityEntry
from app.schemas.issue import IssueRead

VELOCITY_WINDOW = 5
DUE_SOON_DAYS = 7


def _status_counts(db: Session, project_id: int, sprint_id: int | None = None):
    stmt = select(Issue.status, func.count(Issue.id)).where(Issue.project_id == project_id)
    if sprint_id is not None:
        stmt = stmt.where(Issue.sprint_id == sprint_id)
    counts = dict(db.execute(stmt.group_by(Issue.status)).all())
    return {s: counts.get(s, 0) for s in IssueStatus}


def build_dashboard(db: Session, project: Project, today: date | None = None) -> Dashboard:
    today = today or date.today()

    active = sprint_repo.get_active(db, project.id)
    active_summary = None
    if active:
        st = sprint_repo.stats_by_sprint(db, [active.id]).get(active.id, {})
        total, done = st.get("total_points", 0), st.get("done_points", 0)
        active_summary = ActiveSprintSummary(
            id=active.id,
            name=active.name,
            goal=active.goal,
            start_date=active.start_date,
            end_date=active.end_date,
            days_remaining=max((active.end_date - today).days, 0) if active.end_date else None,
            total_points=total,
            done_points=done,
            progress=round(done / total, 4) if total else 0.0,
            issue_count=st.get("issue_count", 0),
            done_count=st.get("done_count", 0),
        )

    closed = list(
        db.scalars(
            select(Sprint)
            .where(Sprint.project_id == project.id, Sprint.status == SprintStatus.closed)
            .order_by(Sprint.closed_at.desc(), Sprint.id.desc())
            .limit(VELOCITY_WINDOW)
        )
    )
    velocity = [
        VelocityEntry(
            sprint_id=s.id,
            name=s.name,
            committed=s.committed_points or 0,
            completed=s.completed_points or 0,
        )
        for s in reversed(closed)
    ]
    avg = round(sum(v.completed for v in velocity) / len(velocity), 1) if velocity else None

    not_done = issue_repo.base_query().where(
        Issue.project_id == project.id, Issue.status != IssueStatus.done
    )
    due_soon = db.scalars(
        not_done.where(
            Issue.due_date.is_not(None),
            Issue.due_date <= today + timedelta(days=DUE_SOON_DAYS),
        ).order_by(Issue.due_date, Issue.position)
    )
    in_progress = db.scalars(
        issue_repo.base_query()
        .where(Issue.project_id == project.id, Issue.status == IssueStatus.in_progress)
        .order_by(Issue.updated_at.desc())
    )

    return Dashboard(
        active_sprint=active_summary,
        sprint_status_counts=_status_counts(db, project.id, active.id)
        if active
        else {s: 0 for s in IssueStatus},
        project_status_counts=_status_counts(db, project.id),
        velocity=velocity,
        average_velocity=avg,
        due_soon=[IssueRead.model_validate(i) for i in due_soon],
        in_progress=[IssueRead.model_validate(i) for i in in_progress],
    )
