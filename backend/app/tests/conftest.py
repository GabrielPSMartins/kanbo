from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.db import Base, get_db, make_engine
from app.main import create_app


@pytest.fixture
def db() -> Iterator[Session]:
    engine = make_engine("sqlite://")
    # StaticPool: todas as conexões compartilham o mesmo banco em memória
    engine.pool = StaticPool(engine.pool._creator)
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with TestSession() as session:
        yield session
    engine.dispose()


@pytest.fixture
def client(db: Session) -> Iterator[TestClient]:
    app = create_app()
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c


@pytest.fixture
def project(client: TestClient) -> dict:
    r = client.post("/api/v1/projects", json={"name": "TCC", "key": "tcc"})
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture
def make_issue(client: TestClient, project: dict):
    def _make(**fields) -> dict:
        body = {"title": "Issue", **fields}
        r = client.post(f"/api/v1/projects/{project['id']}/issues", json=body)
        assert r.status_code == 201, r.text
        return r.json()

    return _make


@pytest.fixture
def make_sprint(client: TestClient, project: dict):
    def _make(**fields) -> dict:
        body = {"name": "Sprint", **fields}
        r = client.post(f"/api/v1/projects/{project['id']}/sprints", json=body)
        assert r.status_code == 201, r.text
        return r.json()

    return _make
