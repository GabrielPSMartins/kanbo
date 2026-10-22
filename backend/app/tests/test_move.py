def _order(client, project, **params):
    r = client.get(f"/api/v1/projects/{project['id']}/issues", params=params)
    return [i["key"] for i in r.json()["items"]]


def _move(client, issue, **body):
    r = client.post(f"/api/v1/issues/{issue['id']}/move", json=body)
    assert r.status_code == 200, r.text
    return r.json()


def test_reorder_between_neighbors(client, project, make_issue):
    a, b, c = make_issue(), make_issue(), make_issue()
    _move(client, c, before_id=a["id"], after_id=b["id"])
    assert _order(client, project) == ["TCC-1", "TCC-3", "TCC-2"]


def test_move_to_top_and_bottom(client, project, make_issue):
    a, _b, c = make_issue(), make_issue(), make_issue()
    _move(client, c, after_id=a["id"])  # vai para o topo
    assert _order(client, project) == ["TCC-3", "TCC-1", "TCC-2"]
    _move(client, c)  # sem vizinhos: vai para o fim
    assert _order(client, project) == ["TCC-1", "TCC-2", "TCC-3"]


def test_only_moved_issue_changes_position(client, project, make_issue):
    issues = [make_issue() for _ in range(4)]
    before = {i["id"]: i["position"] for i in issues}
    moved = _move(client, issues[3], before_id=issues[0]["id"], after_id=issues[1]["id"])
    items = client.get(f"/api/v1/projects/{project['id']}/issues").json()["items"]
    changed = [i["id"] for i in items if i["position"] != before[i["id"]]]
    assert changed == [moved["id"]]


def test_renormalizes_when_gap_is_exhausted(client, project, make_issue):
    a, b, c = make_issue(), make_issue(), make_issue()
    # sempre insere c logo abaixo de a: o gap a↔vizinho cai pela metade a cada vez
    neighbor = b
    for _ in range(60):
        _move(client, c, before_id=a["id"], after_id=neighbor["id"])
        _move(client, b, before_id=a["id"], after_id=c["id"])
        neighbor = c
        b, c = c, b
    keys = _order(client, project)
    assert keys[0] == "TCC-1" and len(set(keys)) == 3
    positions = [
        i["position"]
        for i in client.get(f"/api/v1/projects/{project['id']}/issues").json()["items"]
    ]
    assert positions == sorted(set(positions))


def test_move_between_sections_updates_sprint_and_status(client, project, make_issue, make_sprint):
    sprint = make_sprint()
    s1 = make_issue(sprint_id=sprint["id"])
    backlog_issue = make_issue()

    moved = _move(client, backlog_issue, sprint_id=sprint["id"], before_id=s1["id"])
    assert moved["sprint_id"] == sprint["id"] and moved["status"] == "todo"
    assert _order(client, project, sprint_id=sprint["id"]) == ["TCC-1", "TCC-2"]
    assert [a["action"] for a in moved["activity"]][-2:] == ["moved_to_sprint", "status_changed"]

    moved = _move(client, moved, sprint_id=None)
    assert moved["sprint_id"] is None and moved["status"] == "backlog"


def test_move_on_board_changes_status(client, make_issue, make_sprint):
    sprint = make_sprint()
    issue = make_issue(sprint_id=sprint["id"])
    moved = _move(client, issue, status="done")
    assert moved["status"] == "done" and moved["completed_at"]
    assert moved["sprint_id"] == sprint["id"]


def test_move_validation(client, project, make_issue):
    a = make_issue()
    r = client.post(f"/api/v1/issues/{a['id']}/move", json={"before_id": a["id"]})
    assert r.status_code == 400 and r.json()["code"] == "invalid_move"
    r = client.post(f"/api/v1/issues/{a['id']}/move", json={"before_id": 999})
    assert r.status_code == 404
