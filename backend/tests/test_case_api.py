import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_list_cases_paginated():
    """Verify listing cases returns paginated response envelope."""
    response = client.get("/api/v1/cases?page=1&page_size=10", headers={"X-Demo-Role": "SUPERVISOR"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert len(payload["data"]) <= 10
    assert payload["metadata"]["total_records"] >= 50


def test_case_detail_and_timeline():
    """Verify fetching case detail and its chronological timeline."""
    # Fetch first case
    list_res = client.get("/api/v1/cases?page=1&page_size=1", headers={"X-Demo-Role": "SUPERVISOR"})
    assert list_res.status_code == 200
    case_ref = list_res.json()["data"][0]["case_reference_id"]

    # Fetch detail
    detail_res = client.get(f"/api/v1/cases/{case_ref}", headers={"X-Demo-Role": "SUPERVISOR"})
    assert detail_res.status_code == 200
    assert detail_res.json()["data"]["case_reference_id"] == case_ref

    # Fetch timeline
    timeline_res = client.get(f"/api/v1/cases/{case_ref}/timeline", headers={"X-Demo-Role": "SUPERVISOR"})
    assert timeline_res.status_code == 200
    timeline = timeline_res.json()["data"]
    assert len(timeline) >= 1
    assert "event_type" in timeline[0]
    assert "timestamp" in timeline[0]


def test_transition_api_flow():
    """Verify transitioning a case advances status and adds timeline entry."""
    # Find a case in RECEIVED status
    list_res = client.get("/api/v1/cases?status=Received&page=1&page_size=1", headers={"X-Demo-Role": "SUPERVISOR"})
    assert list_res.status_code == 200
    cases = list_res.json()["data"]
    if not cases:
        pytest.skip("No Received cases available in seed data")
    case_ref = cases[0]["case_reference_id"]

    # 1. Attempt invalid transition Received -> Resolved (Must return 422)
    bad_res = client.post(
        f"/api/v1/cases/{case_ref}/transition",
        headers={"X-Demo-Role": "SUPERVISOR"},
        json={"to_status": "Resolved", "remarks": "Invalid jump"}
    )
    assert bad_res.status_code == 422
    assert bad_res.json()["detail"]["code"] == "INVALID_STATE_TRANSITION"

    # 2. Valid transition Received -> Registered
    good_res = client.post(
        f"/api/v1/cases/{case_ref}/transition",
        headers={"X-Demo-Role": "SUPERVISOR"},
        json={"to_status": "Registered", "remarks": "Intake completed by supervisor"}
    )
    assert good_res.status_code == 200
    assert good_res.json()["data"]["status"] == "Registered"

    # 3. Timeline must now show Registered event
    timeline_res = client.get(f"/api/v1/cases/{case_ref}/timeline", headers={"X-Demo-Role": "SUPERVISOR"})
    assert timeline_res.status_code == 200
    events = timeline_res.json()["data"]
    assert any(e["new_state"] == "Registered" for e in events)


def test_reopen_api():
    """Verify reopening a resolved grievance."""
    list_res = client.get("/api/v1/cases?status=Resolved&page=1&page_size=1", headers={"X-Demo-Role": "SUPERVISOR"})
    assert list_res.status_code == 200
    cases = list_res.json()["data"]
    if not cases:
        pytest.skip("No Resolved cases available in seed data")
    case_ref = cases[0]["case_reference_id"]

    reopen_res = client.post(
        f"/api/v1/cases/{case_ref}/reopen?reason=Complainant+appealed+resolution",
        headers={"X-Demo-Role": "SUPERVISOR"}
    )
    assert reopen_res.status_code == 200
    assert reopen_res.json()["data"]["status"] == "In Progress"
