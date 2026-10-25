import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "/docs" in data["docs"]


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["status"] == "operational"
    assert payload["data"]["database"] == "healthy"


def test_root_head_endpoint():
    """Verify HEAD / returns 200 OK without a response body for UptimeRobot."""
    response = client.head("/")
    assert response.status_code == 200
    assert response.content == b""


def test_root_health_endpoint():
    """Verify GET and HEAD /health return 200 OK."""
    get_res = client.get("/health")
    assert get_res.status_code == 200
    assert get_res.json() == {"status": "ok"}

    head_res = client.head("/health")
    assert head_res.status_code == 200
    assert head_res.content == b""


def test_api_v1_health_head_endpoint():
    """Verify HEAD /api/v1/health returns 200 OK."""
    response = client.head("/api/v1/health")
    assert response.status_code == 200
    assert response.content == b""

