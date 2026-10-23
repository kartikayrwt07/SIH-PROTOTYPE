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
