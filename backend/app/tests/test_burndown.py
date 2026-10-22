from datetime import date, datetime, timedelta

from app.models import ActivityLog
from app.scripts.seed import S1_START, S2_START, TODAY, seed
from app.services.burndown import IssueHistory, IssueState, compute_burndown


def _log(action, frm, to, when):
    return ActivityLog(action=action, from_value=frm, to_value=to, created_at=when)


def test_compute_burndown_replays_history():
    start, end = date(2026, 10, 1), date(2026, 10, 5)
    t0 = datetime(2026, 9, 30, 12)
    histories = [
        # 5 pts, concluída no dia 2
        IssueHistory(
            t0,
            IssueState(1, "done", 5),
            [_log("status_changed", "todo", "done", datetime(2026, 10, 2, 15))],
        ),
        # 3 pts, re-estimada de 2→3 no dia 3, ainda aberta
        IssueHistory(
            t0,
            IssueState(1, "in_progress", 3),
            [_log("points_changed", "2", "3", datetime(2026, 10, 3, 9))],
        ),
        # 8 pts, removida da sprint no dia 4
        IssueHistory(
            t0,
            IssueState(None, "backlog", 8),
            [_log("moved_to_sprint", "1", None, datetime(2026, 10, 4, 10))],
        ),
        # adicionada no meio da sprint (criada no dia 3)
        IssueHistory(datetime(2026, 10, 3, 11), IssueState(1, "todo", 1)),
        # nunca esteve na sprint
        IssueHistory(t0, IssueState(2, "todo", 13)),
    ]
    points = compute_burndown(1, start, end, 15, histories, datetime(2026, 10, 4, 20))
    assert [p.date for p in points] == [start + timedelta(days=i) for i in range(5)]
    assert [p.remaining for p in points] == [15, 10, 12, 4, None]
    assert [p.ideal for p in points] == [15, 11.25, 7.5, 3.75, 0]


def test_burndown_endpoint_with_seed(client, db):
    seed(db)
    sprints = {s["name"]: s for s in client.get("/api/v1/projects/1/sprints").json()}

    active = client.get(f"/api/v1/sprints/{sprints['Sprint 2']['id']}/burndown").json()
    pts = active["points"]
    assert active["committed_points"] == 35 and len(pts) == 14
    assert pts[0]["date"] == S2_START.isoformat()
    remaining = [p["remaining"] for p in pts]
    elapsed = (TODAY - S2_START).days
    # dia 3: -5 · dia 4: +1 (re-estimativa) · dia 5: -3 · dia 6: -2 · dia 8: -2
    assert remaining[: elapsed + 1] == [35, 35, 35, 30, 31, 28, 26, 26, 24, 24, 24]
    assert all(r is None for r in remaining[elapsed + 1 :])

    closed = client.get(f"/api/v1/sprints/{sprints['Sprint 1']['id']}/burndown").json()
    assert closed["committed_points"] == 32
    assert closed["points"][0]["date"] == S1_START.isoformat()
    # só a issue de 8 pts que foi para a sprint 2 ficou pendente no fim
    assert closed["points"][-1]["remaining"] == 8
