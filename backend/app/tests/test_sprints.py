import pytest


def _start(client, sprint, **body):
    return client.post(f"/api/v1/sprints/{sprint['id']}/start", json=body or None)


def _close(client, sprint, **body):
    return client.post(f"/api/v1/sprints/{sprint['id']}/close", json=body)


def test_start_sprint_sets_dates_and_commitment(client, make_sprint, make_issue):
    s = make_sprint()
    make_issue(sprint_id=s["id"], story_points=3)
    make_issue(sprint_id=s["id"], story_points=5)
    r = _start(client, s, start_date="2026-10-01")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "active"
    assert body["start_date"] == "2026-10-01" and body["end_date"] == "2026-10-14"
    assert body["committed_points"] == 8 and body["started_at"]


def test_only_one_active_sprint(client, make_sprint):
    s1, s2 = make_sprint(), make_sprint()
    assert _start(client, s1).status_code == 200
    r = _start(client, s2)
    assert r.status_code == 409
    assert r.json()["code"] == "sprint_already_active"


def test_cannot_start_closed_or_active_sprint(client, make_sprint):
    s = make_sprint()
    _start(client, s)
    assert _start(client, s).json()["code"] == "sprint_not_planned"
    _close(client, s)
    assert _start(client, s).status_code == 400


def test_active_sprint_rule_enforced_by_db(db, project):
    from sqlalchemy.exc import IntegrityError

    from app.models import Sprint, SprintStatus

    db.add_all(
        [
            Sprint(project_id=project["id"], name="a", status=SprintStatus.active),
            Sprint(project_id=project["id"], name="b", status=SprintStatus.active),
        ]
    )
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_close_moves_pending_to_backlog(client, project, make_sprint, make_issue):
    s = make_sprint()
    done = make_issue(sprint_id=s["id"], story_points=5)
    pending = make_issue(sprint_id=s["id"], story_points=3)
    _start(client, s)
    client.patch(f"/api/v1/issues/{done['id']}", json={"status": "done"})
    client.patch(f"/api/v1/issues/{pending['id']}", json={"status": "in_progress"})

    r = _close(client, s, move_to="backlog")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "closed" and body["closed_at"]
    assert body["completed_points"] == 5 and body["committed_points"] == 8

    p = client.get(f"/api/v1/issues/{pending['id']}").json()
    assert p["sprint_id"] is None and p["status"] == "backlog"
    d = client.get(f"/api/v1/issues/{done['id']}").json()
    assert d["sprint_id"] == s["id"]  # concluída fica no histórico da sprint


def test_close_moves_pending_to_next_sprint_keeping_status(client, make_sprint, make_issue):
    s, nxt = make_sprint(), make_sprint(name="Próxima")
    pending = make_issue(sprint_id=s["id"])
    _start(client, s)
    client.patch(f"/api/v1/issues/{pending['id']}", json={"status": "in_progress"})
    r = _close(client, s, move_to="sprint", target_sprint_id=nxt["id"])
    assert r.status_code == 200
    p = client.get(f"/api/v1/issues/{pending['id']}").json()
    assert p["sprint_id"] == nxt["id"] and p["status"] == "in_progress"
    # agora a próxima pode ser iniciada
    assert _start(client, nxt).status_code == 200


def test_close_validation(client, make_sprint):
    s = make_sprint()
    assert _close(client, s).json()["code"] == "sprint_not_active"
    _start(client, s)
    assert _close(client, s, move_to="sprint").status_code == 422
    r = _close(client, s, move_to="sprint", target_sprint_id=s["id"])
    assert r.json()["code"] == "invalid_target_sprint"


def test_cannot_add_issue_to_closed_sprint(client, project, make_sprint):
    s = make_sprint()
    _start(client, s)
    _close(client, s)
    r = client.post(
        f"/api/v1/projects/{project['id']}/issues", json={"title": "x", "sprint_id": s["id"]}
    )
    assert r.json()["code"] == "sprint_closed"


def test_cannot_delete_active_sprint(client, make_sprint):
    s = make_sprint()
    _start(client, s)
    assert client.delete(f"/api/v1/sprints/{s['id']}").json()["code"] == "sprint_active"
