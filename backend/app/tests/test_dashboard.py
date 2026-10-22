from app.scripts.seed import seed


def test_dashboard_with_seed(client, db):
    seed(db)
    d = client.get("/api/v1/projects/1/dashboard").json()
    a = d["active_sprint"]
    assert a["name"] == "Sprint 2"
    assert (a["done_points"], a["total_points"]) == (12, 36)
    assert a["days_remaining"] == 3
    assert d["velocity"] == [{"sprint_id": 1, "name": "Sprint 1", "committed": 32, "completed": 24}]
    assert d["average_velocity"] == 24
    assert sum(d["sprint_status_counts"].values()) == 10
    assert sum(d["project_status_counts"].values()) == 26
    due = [i["key"] for i in d["due_soon"]]
    assert due[0] == "TCC-15"  # atrasada aparece primeiro
    assert all(i["status"] != "done" for i in d["due_soon"])
    assert {i["status"] for i in d["in_progress"]} == {"in_progress"}


def test_dashboard_without_active_sprint(client, project):
    d = client.get(f"/api/v1/projects/{project['id']}/dashboard").json()
    assert d["active_sprint"] is None and d["velocity"] == [] and d["average_velocity"] is None
