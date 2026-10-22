"""Burndown calculado a partir do ActivityLog.

Ideia: o estado atual de cada issue é conhecido; para saber o estado num instante `t`,
desfazemos (do mais recente para o mais antigo) os logs posteriores a `t` usando `from_value`.
Assim não dependemos de snapshots — só do histórico de mudanças."""

from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import ActivityAction, ActivityLog, Issue, IssueStatus, Sprint
from app.models.base import now
from app.schemas.sprint import Burndown, BurndownPoint


@dataclass
class IssueState:
    sprint_id: int | None
    status: str
    points: int


@dataclass
class IssueHistory:
    created_at: datetime
    current: IssueState
    logs: list[ActivityLog] = field(default_factory=list)  # ordenados por created_at

    def state_at(self, t: datetime) -> IssueState | None:
        if self.created_at > t:
            return None
        state = IssueState(self.current.sprint_id, self.current.status, self.current.points)
        for log in reversed(self.logs):
            if log.created_at <= t:
                break
            match log.action:
                case ActivityAction.status_changed:
                    state.status = log.from_value or IssueStatus.backlog.value
                case ActivityAction.moved_to_sprint:
                    state.sprint_id = int(log.from_value) if log.from_value else None
                case ActivityAction.points_changed:
                    state.points = int(log.from_value) if log.from_value else 0
        return state


def remaining_at(histories: list[IssueHistory], sprint_id: int, t: datetime) -> int:
    total = 0
    for h in histories:
        s = h.state_at(t)
        if s and s.sprint_id == sprint_id and s.status != IssueStatus.done:
            total += s.points
    return total


def scope_at(histories: list[IssueHistory], sprint_id: int, t: datetime) -> int:
    total = 0
    for h in histories:
        s = h.state_at(t)
        if s and s.sprint_id == sprint_id:
            total += s.points
    return total


def compute_burndown(
    sprint_id: int,
    start: date,
    end: date,
    committed: int,
    histories: list[IssueHistory],
    current_time: datetime,
) -> list[BurndownPoint]:
    """Uma entrada por dia: `remaining` = pontos não concluídos no FIM do dia
    (None para dias futuros); `ideal` vai linearmente de `committed` a 0."""
    n_days = (end - start).days + 1
    points: list[BurndownPoint] = []
    for i in range(n_days):
        day = start + timedelta(days=i)
        ideal = committed * (1 - i / (n_days - 1)) if n_days > 1 else 0.0
        if day > current_time.date():
            remaining = None
        else:
            t = min(datetime.combine(day, time.max), current_time)
            remaining = float(remaining_at(histories, sprint_id, t))
        points.append(BurndownPoint(date=day, ideal=round(ideal, 2), remaining=remaining))
    return points


def load_histories(db: Session, sprint_id: int) -> list[IssueHistory]:
    sid = str(sprint_id)
    moved_through = select(ActivityLog.issue_id).where(
        ActivityLog.action == ActivityAction.moved_to_sprint,
        or_(ActivityLog.from_value == sid, ActivityLog.to_value == sid),
    )
    issues = db.scalars(
        select(Issue)
        .where(or_(Issue.sprint_id == sprint_id, Issue.id.in_(moved_through)))
        .options(selectinload(Issue.activity))
    )
    return [
        IssueHistory(
            created_at=issue.created_at,
            current=IssueState(issue.sprint_id, issue.status.value, issue.story_points or 0),
            logs=sorted(issue.activity, key=lambda a: (a.created_at, a.id)),
        )
        for issue in issues
    ]


def sprint_burndown(db: Session, sprint: Sprint) -> Burndown:
    if not sprint.start_date or not sprint.end_date:
        return Burndown(sprint_id=sprint.id, committed_points=0, points=[])
    histories = load_histories(db, sprint.id)
    # instante logo antes do fechamento: ao fechar, as pendentes saem da sprint e o
    # burndown mostraria 0 artificialmente
    current = sprint.closed_at - timedelta(seconds=1) if sprint.closed_at else now()
    committed = sprint.committed_points
    if committed is None:
        start_t = sprint.started_at or datetime.combine(sprint.start_date, time.min)
        committed = scope_at(histories, sprint.id, start_t)
    return Burndown(
        sprint_id=sprint.id,
        committed_points=committed,
        points=compute_burndown(
            sprint.id, sprint.start_date, sprint.end_date, committed, histories, current
        ),
    )
