import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_dashboard_metrics_kpis():
    """Verify aggregate operational KPIs and multidimensional breakdowns."""
    response = client.get("/api/v1/dashboard/metrics", headers={"X-Demo-Role": "SUPERVISOR"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    data = payload["data"]
    assert "kpis" in data
    kpis = data["kpis"]

    assert kpis["total_cases"] >= 50
    assert kpis["open_cases"] + kpis["resolved_closed"] == kpis["total_cases"]
    assert kpis["resolution_rate_pct"] >= 0.0

    # Multi-dimensional breakdowns
    assert len(data["by_bureau"]) >= 4
    assert "Received" in data["by_status"] or "In Progress" in data["by_status"]
    assert "MEDIUM" in data["by_priority"] or "HIGH" in data["by_priority"]
    assert len(data["by_category"]) >= 3


def test_dashboard_metrics_role_scoping():
    """Verify Bureau Case Officers receive server-side scoped analytics."""
    # Global supervisor view
    sup_res = client.get("/api/v1/dashboard/metrics", headers={"X-Demo-Role": "SUPERVISOR"})
    assert sup_res.status_code == 200
    global_total = sup_res.json()["data"]["kpis"]["total_cases"]

    # Scoped officer view (assigned to APPR bureau)
    off_res = client.get("/api/v1/dashboard/metrics", headers={"X-Demo-Role": "OFFICER"})
    assert off_res.status_code == 200
    scoped_total = off_res.json()["data"]["kpis"]["total_cases"]

    # Scoped count must be strictly less than global total
    assert scoped_total < global_total
    assert scoped_total > 0


def test_bottleneck_analysis_dwell_times():
    """Verify lifecycle stage dwell-time latency metrics and bottleneck detection."""
    response = client.get("/api/v1/dashboard/bottlenecks", headers={"X-Demo-Role": "SUPERVISOR"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    analysis = payload["data"]
    assert "stages" in analysis
    assert len(analysis["stages"]) == 9
    assert analysis["primary_bottleneck_stage"] is not None
    assert "system_health_status" in analysis

    stage_names = [s["stage"] for s in analysis["stages"]]
    assert "Under Triage" in stage_names
    assert "Under Review" in stage_names

    for stage in analysis["stages"]:
        assert "avg_hours" in stage
        assert "avg_days" in stage
        assert "is_bottleneck" in stage
        assert stage["avg_hours"] >= 0.0


def test_bureau_workload_breakdown():
    """Verify cross-bureau volume comparison and resolution velocity."""
    response = client.get("/api/v1/dashboard/workload", headers={"X-Demo-Role": "SUPERVISOR"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    workload = payload["data"]
    assert len(workload) >= 4
    for b in workload:
        assert "bureau_code" in b
        assert "total_cases" in b
        assert "open_cases" in b
        assert "overdue_cases" in b
        assert "resolution_rate_pct" in b
        assert b["total_cases"] == b["open_cases"] + b["resolved_cases"]


def test_institution_performance_table():
    """Verify institution performance ranking table with SLA breaches and recurring themes."""
    response = client.get("/api/v1/dashboard/institutions", headers={"X-Demo-Role": "SUPERVISOR"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    institutions = payload["data"]
    assert len(institutions) > 0

    first = institutions[0]
    assert "institution_id" in first
    assert "aicte_permanent_id" in first
    assert "name" in first
    assert "state" in first
    assert "district" in first
    assert "total_cases" in first
    assert "open_cases" in first
    assert "pending_cases" in first
    assert "resolved_cases" in first
    assert "overdue_cases" in first
    assert "resolution_rate_pct" in first
    assert "top_recurring_categories" in first
    assert "intervention_status" in first

    # Check intervention status values
    valid_statuses = {"CRITICAL_INTERVENTION", "WATCHLIST", "COMPLIANT"}
    for inst in institutions:
        assert inst["intervention_status"] in valid_statuses
        assert inst["total_cases"] == inst["open_cases"] + inst["resolved_cases"]
        assert 0.0 <= inst["resolution_rate_pct"] <= 100.0


def test_institution_performance_filtering():
    """Verify state and intervention_status query parameter filtering."""
    # First get all institutions to find an existing state
    base_response = client.get("/api/v1/dashboard/institutions", headers={"X-Demo-Role": "SUPERVISOR"})
    assert base_response.status_code == 200
    all_insts = base_response.json()["data"]
    assert len(all_insts) > 0

    target_state = all_insts[0]["state"]

    # Filter by state
    state_res = client.get(f"/api/v1/dashboard/institutions?state={target_state}", headers={"X-Demo-Role": "SUPERVISOR"})
    assert state_res.status_code == 200
    state_insts = state_res.json()["data"]
    assert len(state_insts) > 0
    for inst in state_insts:
        assert target_state.lower() in inst["state"].lower()

    # Filter by intervention status
    for status in ["CRITICAL_INTERVENTION", "WATCHLIST", "COMPLIANT"]:
        status_res = client.get(f"/api/v1/dashboard/institutions?intervention_status={status}", headers={"X-Demo-Role": "SUPERVISOR"})
        assert status_res.status_code == 200
        for inst in status_res.json()["data"]:
            assert inst["intervention_status"] == status


def test_dashboard_metrics_institution_filtering():
    """Verify that filtering dashboard metrics by institution_id returns college-scoped KPIs."""
    inst_res = client.get("/api/v1/institutions/all", headers={"X-Demo-Role": "SUPERVISOR"})
    assert inst_res.status_code == 200
    insts = inst_res.json()["data"]
    assert len(insts) > 0
    test_inst_id = insts[0]["id"]

    # Global total
    global_res = client.get("/api/v1/dashboard/metrics", headers={"X-Demo-Role": "SUPERVISOR"})
    global_total = global_res.json()["data"]["kpis"]["total_cases"]

    # Scoped total for single institution
    scoped_res = client.get(f"/api/v1/dashboard/metrics?institution_id={test_inst_id}", headers={"X-Demo-Role": "SUPERVISOR"})
    assert scoped_res.status_code == 200
    scoped_data = scoped_res.json()["data"]
    scoped_total = scoped_data["kpis"]["total_cases"]

    assert scoped_total <= global_total
    assert scoped_data["kpis"]["open_cases"] + scoped_data["kpis"]["resolved_closed"] == scoped_total


def test_bottlenecks_institution_filtering():
    """Verify that filtering bottlenecks by institution_id scopes lifecycle stage counts."""
    inst_res = client.get("/api/v1/institutions/all", headers={"X-Demo-Role": "SUPERVISOR"})
    test_inst_id = inst_res.json()["data"][0]["id"]

    scoped_res = client.get(f"/api/v1/dashboard/bottlenecks?institution_id={test_inst_id}", headers={"X-Demo-Role": "SUPERVISOR"})
    assert scoped_res.status_code == 200
    data = scoped_res.json()["data"]
    assert "stages" in data
    assert len(data["stages"]) == 9


def test_spam_rejection_metrics_isolation():
    """Verify that spam/malformed rejections populate rejected_spam_cases and do not corrupt MTTR."""
    res = client.get("/api/v1/dashboard/metrics", headers={"X-Demo-Role": "SUPERVISOR"})
    assert res.status_code == 200
    kpis = res.json()["data"]["kpis"]

    assert "rejected_spam_cases" in kpis
    assert "avg_resolution_hours" in kpis
    assert "avg_resolution_days" in kpis

    # Mathematical integrity check: Total must cleanly account for Open, Resolved/Closed, and Rejected
    assert kpis["total_cases"] == kpis["open_cases"] + kpis["resolved_closed"] + kpis["rejected_spam_cases"]
    assert kpis["avg_resolution_hours"] >= 0.0


