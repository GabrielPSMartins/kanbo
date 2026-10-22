def test_create_project_uppercases_key(project):
    assert project["key"] == "TCC"


def test_duplicate_key_returns_conflict(client, project):
    r = client.post("/api/v1/projects", json={"name": "Outro", "key": "TCC"})
    assert r.status_code == 409
    assert r.json() == {"detail": "Já existe um projeto com a key TCC", "code": "duplicate_key"}


def test_validation_error_format(client):
    r = client.post("/api/v1/projects", json={"name": "X", "key": "1!"})
    assert r.status_code == 422
    body = r.json()
    assert body["code"] == "validation_error"
    assert "key" in body["detail"]


def test_not_found_format(client):
    r = client.get("/api/v1/projects/999")
    assert r.status_code == 404
    assert r.json()["code"] == "not_found"


def test_update_and_delete_project(client, project):
    r = client.patch(f"/api/v1/projects/{project['id']}", json={"name": "Meu TCC"})
    assert r.json()["name"] == "Meu TCC"
    assert client.delete(f"/api/v1/projects/{project['id']}").status_code == 204
    assert client.get("/api/v1/projects").json() == []
