def test_keys_are_sequential_per_project(client, project, make_issue):
    keys = [make_issue(title=f"i{n}")["key"] for n in range(3)]
    assert keys == ["TCC-1", "TCC-2", "TCC-3"]

    other = client.post("/api/v1/projects", json={"name": "Outro", "key": "OUT"}).json()
    r = client.post(f"/api/v1/projects/{other['id']}/issues", json={"title": "x"})
    assert r.json()["key"] == "OUT-1"


def test_numbers_are_not_reused_after_delete(client, make_issue):
    first = make_issue()
    client.delete(f"/api/v1/issues/{first['id']}")
    assert make_issue()["key"] == "TCC-2"


def test_get_by_key(client, make_issue):
    issue = make_issue(title="Escrever introdução")
    r = client.get("/api/v1/issues/by-key/tcc-1")
    assert r.status_code == 200
    assert r.json()["id"] == issue["id"]
    assert client.get("/api/v1/issues/by-key/TCC-99").status_code == 404


def test_create_defaults_and_created_activity(make_issue):
    issue = make_issue()
    assert issue["status"] == "backlog"
    assert issue["priority"] == "none"
    assert [a["action"] for a in issue["activity"]] == ["created"]


def test_issue_in_sprint_defaults_to_todo(make_issue, make_sprint):
    sprint = make_sprint()
    assert make_issue(sprint_id=sprint["id"])["status"] == "todo"


def test_story_points_must_be_fibonacci(client, project):
    url = f"/api/v1/projects/{project['id']}/issues"
    assert client.post(url, json={"title": "x", "story_points": 4}).status_code == 422
    assert client.post(url, json={"title": "x", "story_points": 5}).status_code == 201


def test_patch_logs_activity(client, make_issue):
    issue = make_issue(story_points=3)
    r = client.patch(
        f"/api/v1/issues/{issue['id']}",
        json={"status": "done", "story_points": 5, "priority": "high"},
    )
    body = r.json()
    assert body["status"] == "done"
    assert body["completed_at"] is not None
    actions = {a["action"]: (a["from_value"], a["to_value"]) for a in body["activity"]}
    assert actions["status_changed"] == ("backlog", "done")
    assert actions["points_changed"] == ("3", "5")
    assert actions["priority_changed"] == ("none", "high")

    body = client.patch(f"/api/v1/issues/{issue['id']}", json={"status": "todo"}).json()
    assert body["completed_at"] is None


def test_patch_null_on_required_field_is_rejected(client, make_issue):
    issue = make_issue()
    r = client.patch(f"/api/v1/issues/{issue['id']}", json={"title": None})
    assert r.status_code == 422


def test_patch_sprint_adjusts_status(client, make_issue, make_sprint):
    sprint = make_sprint()
    issue = make_issue()
    body = client.patch(f"/api/v1/issues/{issue['id']}", json={"sprint_id": sprint["id"]}).json()
    assert body["sprint_id"] == sprint["id"]
    assert body["status"] == "todo"
    body = client.patch(f"/api/v1/issues/{issue['id']}", json={"sprint_id": None}).json()
    assert body["status"] == "backlog"


def test_labels(client, project, make_issue):
    pid = project["id"]
    bug = client.post(f"/api/v1/projects/{pid}/labels", json={"name": "escrita"}).json()
    issue = make_issue(label_ids=[bug["id"]])
    assert [lb["name"] for lb in issue["labels"]] == ["escrita"]
    body = client.patch(f"/api/v1/issues/{issue['id']}", json={"label_ids": []}).json()
    assert body["labels"] == []
    r = client.post(f"/api/v1/projects/{pid}/issues", json={"title": "x", "label_ids": [999]})
    assert r.status_code == 404


def test_list_filters_and_pagination(client, project, make_issue, make_sprint):
    pid = project["id"]
    sprint = make_sprint()
    make_issue(title="Revisar capítulo 1", type="task", priority="high", sprint_id=sprint["id"])
    make_issue(title="Bug no gráfico", type="bug", priority="urgent")
    make_issue(title="Pesquisar artigos", type="research")

    def titles(**params):
        r = client.get(f"/api/v1/projects/{pid}/issues", params=params)
        return [i["title"] for i in r.json()["items"]]

    assert titles(sprint_id=sprint["id"]) == ["Revisar capítulo 1"]
    assert titles(in_backlog=True) == ["Bug no gráfico", "Pesquisar artigos"]
    assert titles(type=["bug", "research"]) == ["Bug no gráfico", "Pesquisar artigos"]
    assert titles(priority="urgent") == ["Bug no gráfico"]
    assert titles(q="capítulo") == ["Revisar capítulo 1"]
    assert titles(q="TCC-3") == ["Pesquisar artigos"]

    page = client.get(f"/api/v1/projects/{pid}/issues", params={"limit": 2, "offset": 2}).json()
    assert page["total"] == 3 and len(page["items"]) == 1


def test_checklist_crud(client, make_issue):
    issue = make_issue()
    url = f"/api/v1/issues/{issue['id']}/checklist"
    a = client.post(url, json={"text": "Ler artigo"}).json()
    client.post(url, json={"text": "Fichar"})
    client.patch(f"{url}/{a['id']}", json={"done": True})
    detail = client.get(f"/api/v1/issues/{issue['id']}").json()
    assert detail["checklist_total"] == 2 and detail["checklist_done"] == 1
    assert [c["text"] for c in detail["checklist"]] == ["Ler artigo", "Fichar"]
    assert client.delete(f"{url}/{a['id']}").status_code == 204
    assert len(client.get(url).json()) == 1
