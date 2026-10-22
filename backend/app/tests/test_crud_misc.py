def test_sprint_crud(client, project, make_sprint, make_issue):
    s = make_sprint(name="Sprint 1", goal="Cap. 1", start_date="2026-10-01", end_date="2026-10-14")
    assert s["status"] == "planned" and s["issue_count"] == 0
    make_issue(sprint_id=s["id"], story_points=3)

    s2 = client.get(f"/api/v1/sprints/{s['id']}").json()
    assert s2["issue_count"] == 1 and s2["total_points"] == 3

    r = client.patch(f"/api/v1/sprints/{s['id']}", json={"end_date": "2026-09-01"})
    assert r.status_code == 422

    assert client.delete(f"/api/v1/sprints/{s['id']}").status_code == 204
    issues = client.get(f"/api/v1/projects/{project['id']}/issues").json()["items"]
    assert issues[0]["sprint_id"] is None and issues[0]["status"] == "backlog"


def test_sprint_dates_validation(client, project):
    r = client.post(
        f"/api/v1/projects/{project['id']}/sprints",
        json={"name": "S", "start_date": "2026-10-10", "end_date": "2026-10-01"},
    )
    assert r.status_code == 422


def test_epic_progress(client, project, make_issue):
    pid = project["id"]
    epic = client.post(f"/api/v1/projects/{pid}/epics", json={"title": "Cap. 2"}).json()
    make_issue(epic_id=epic["id"], story_points=5, status="done")
    make_issue(epic_id=epic["id"], story_points=3)
    [e] = client.get(f"/api/v1/projects/{pid}/epics").json()
    assert (e["issue_count"], e["done_count"], e["total_points"], e["done_points"]) == (2, 1, 8, 5)


def test_label_unique_name(client, project):
    url = f"/api/v1/projects/{project['id']}/labels"
    client.post(url, json={"name": "doc"})
    assert client.post(url, json={"name": "doc"}).status_code == 409
