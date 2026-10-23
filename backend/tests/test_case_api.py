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
    list_res = client.get("/api/v1/cases?page=1&page_size=15", headers={"X-Demo-Role": "SUPERVISOR"})
    assert list_res.status_code == 200
    cases = list_res.json()["data"]
    # Pick a case that is not Closed
    target_case = next((c for c in cases if c["status"] != "Closed"), cases[0])
    case_ref = target_case["case_reference_id"]
    from_status = target_case["status"]

    # 1. Attempt invalid transition directly to Closed (unless currently Resolved)
    if from_status != "Resolved":
        bad_res = client.post(
            f"/api/v1/cases/{case_ref}/transition",
            headers={"X-Demo-Role": "SUPERVISOR"},
            json={"to_status": "Closed", "remarks": "Invalid jump directly to Closed"}
        )
        assert bad_res.status_code == 422
        assert bad_res.json()["detail"]["code"] == "INVALID_STATE_TRANSITION"

    # 2. Valid transition to next logical state
    next_states = {
        "Received": "Registered",
        "Registered": "Under Triage",
        "Under Triage": "Assigned",
        "Assigned": "In Progress",
        "In Progress": "Under Review",
        "Under Review": "Resolved",
        "Resolved": "Closed",
    }
    if from_status in next_states:
        target_next = next_states[from_status]
        good_res = client.post(
            f"/api/v1/cases/{case_ref}/transition",
            headers={"X-Demo-Role": "SUPERVISOR"},
            json={"to_status": target_next, "remarks": f"Transitioned to {target_next} during test"}
        )
        assert good_res.status_code == 200
        assert good_res.json()["data"]["status"] == target_next

        # 3. Timeline must now show this event
        timeline_res = client.get(f"/api/v1/cases/{case_ref}/timeline", headers={"X-Demo-Role": "SUPERVISOR"})
        assert timeline_res.status_code == 200
        events = timeline_res.json()["data"]
        assert any(e["new_state"] == target_next for e in events)


def test_reopen_api():
    """Verify reopening a resolved grievance."""
    list_res = client.get("/api/v1/cases?status=Resolved&page=1&page_size=1", headers={"X-Demo-Role": "SUPERVISOR"})
    assert list_res.status_code == 200
    cases = list_res.json()["data"]
    if not cases:
        # Transition an Under Review case to Resolved first
        ur_res = client.get("/api/v1/cases?status=Under Review&page=1&page_size=1", headers={"X-Demo-Role": "SUPERVISOR"})
        ur_cases = ur_res.json()["data"]
        if ur_cases:
            case_ref = ur_cases[0]["case_reference_id"]
            client.post(
                f"/api/v1/cases/{case_ref}/transition",
                headers={"X-Demo-Role": "SUPERVISOR"},
                json={"to_status": "Resolved", "remarks": "Resolved prior to test reopen"}
            )
        else:
            pytest.skip("No suitable case available to resolve and reopen")
    else:
        case_ref = cases[0]["case_reference_id"]

    reopen_res = client.post(
        f"/api/v1/cases/{case_ref}/reopen?reason=Complainant+appealed+resolution",
        headers={"X-Demo-Role": "SUPERVISOR"}
    )
    assert reopen_res.status_code == 200
    assert reopen_res.json()["data"]["status"] == "In Progress"


def test_search_by_institution_and_sorting():
    """Verify searching by institution name and sorting results dynamically."""
    # 1. Search by known institution prefix from seed data
    search_res = client.get("/api/v1/cases?search=Institute&page=1&page_size=5", headers={"X-Demo-Role": "SUPERVISOR"})
    assert search_res.status_code == 200
    payload = search_res.json()
    assert payload["success"] is True
    assert len(payload["data"]) >= 1

    # 2. Sort by created_at ascending vs descending
    asc_res = client.get("/api/v1/cases?sort_by=created_at&sort_dir=asc&page=1&page_size=5", headers={"X-Demo-Role": "SUPERVISOR"})
    assert asc_res.status_code == 200
    asc_cases = asc_res.json()["data"]

    desc_res = client.get("/api/v1/cases?sort_by=created_at&sort_dir=desc&page=1&page_size=5", headers={"X-Demo-Role": "SUPERVISOR"})
    assert desc_res.status_code == 200
    desc_cases = desc_res.json()["data"]

    if len(asc_cases) > 1 and len(desc_cases) > 1:
        assert asc_cases[0]["case_reference_id"] != desc_cases[0]["case_reference_id"]

    # 3. Filter by priority
    urgent_res = client.get("/api/v1/cases?priority=URGENT", headers={"X-Demo-Role": "SUPERVISOR"})
    assert urgent_res.status_code == 200
    for c in urgent_res.json()["data"]:
        assert c["priority"] == "URGENT"


def test_case_notes():
    """Verify adding notes, confidential note filtering for auditors, and audit event creation."""
    list_res = client.get("/api/v1/cases?page=1&page_size=1", headers={"X-Demo-Role": "SUPERVISOR"})
    assert list_res.status_code == 200
    case_ref = list_res.json()["data"][0]["case_reference_id"]

    # 1. Supervisor adds a public note
    pub_res = client.post(
        f"/api/v1/cases/{case_ref}/notes",
        headers={"X-Demo-Role": "SUPERVISOR"},
        json={"content": "Inspection scheduled for following Monday", "is_confidential": False}
    )
    assert pub_res.status_code == 200
    assert pub_res.json()["data"]["content"] == "Inspection scheduled for following Monday"
    assert pub_res.json()["data"]["is_confidential"] is False

    # 2. Supervisor adds a confidential internal note
    conf_res = client.post(
        f"/api/v1/cases/{case_ref}/notes",
        headers={"X-Demo-Role": "SUPERVISOR"},
        json={"content": "Confidential disciplinary review underway", "is_confidential": True}
    )
    assert conf_res.status_code == 200
    assert conf_res.json()["data"]["is_confidential"] is True

    # 3. Auditor cannot add notes (403 Forbidden)
    auditor_post = client.post(
        f"/api/v1/cases/{case_ref}/notes",
        headers={"X-Demo-Role": "AUDITOR"},
        json={"content": "Auditor attempting unauthorized write", "is_confidential": False}
    )
    assert auditor_post.status_code == 403

    # 4. Auditor reading notes: must NOT see the confidential note
    auditor_notes = client.get(f"/api/v1/cases/{case_ref}/notes", headers={"X-Demo-Role": "AUDITOR"})
    assert auditor_notes.status_code == 200
    auditor_data = auditor_notes.json()["data"]
    assert not any(n["is_confidential"] for n in auditor_data)

    # 5. Timeline must record NOTE_ADDED events
    timeline = client.get(f"/api/v1/cases/{case_ref}/timeline", headers={"X-Demo-Role": "SUPERVISOR"}).json()["data"]
    assert any(e["event_type"] == "NOTE_ADDED" for e in timeline)


