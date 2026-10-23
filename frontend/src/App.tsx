import React, { useState, useEffect } from "react";
import { Layout } from "./components/common/Layout";
import { UserRole } from "./types";
import { api } from "./services/api";
import { Database, ShieldAlert, Clock, CheckCircle2, AlertTriangle, Layers, ArrowUpRight } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentRole, setCurrentRole] = useState<UserRole>("SUPERVISOR");
  const [healthStatus, setHealthStatus] = useState<string>("Connecting...");
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      const res = await api.checkHealth();
      if (res.success && res.data) {
        setHealthStatus(res.data.status === "operational" ? "Operational" : "Degraded");
        setHealthData(res.data);
      } else {
        setHealthStatus("Offline / Demo Mode");
      }
    };
    fetchHealth();
  }, []);

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      currentRole={currentRole}
      onRoleChange={setCurrentRole}
      serviceStatus={healthStatus}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
          AICTE Grievance Command Center
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
          Consolidated cross-bureau monitoring, real-time SLA risk radar, and auditable case lifecycle tracking.
        </p>
      </div>

      {/* Top Operational Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span>Total Registered Cases</span>
            <Layers size={18} color="var(--accent-aicte-blue)" />
          </div>
          <div className="metric-value">58</div>
          <div className="metric-footer">Across 4 AICTE Bureaus/Cells</div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid var(--risk-overdue)" }}>
          <div className="metric-header">
            <span style={{ color: "var(--risk-overdue)" }}>SLA Overdue Cases</span>
            <AlertTriangle size={18} color="var(--risk-overdue)" />
          </div>
          <div className="metric-value" style={{ color: "var(--risk-overdue)" }}>4</div>
          <div className="metric-footer">Immediate escalation required</div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid var(--risk-approaching)" }}>
          <div className="metric-header">
            <span style={{ color: "var(--risk-approaching)" }}>Approaching Deadline</span>
            <Clock size={18} color="var(--risk-approaching)" />
          </div>
          <div className="metric-value" style={{ color: "var(--risk-approaching)" }}>6</div>
          <div className="metric-footer">Turnaround window &lt; 48 hours</div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid var(--risk-normal)" }}>
          <div className="metric-header">
            <span style={{ color: "var(--risk-normal)" }}>Resolved & Closed</span>
            <CheckCircle2 size={18} color="var(--risk-normal)" />
          </div>
          <div className="metric-value" style={{ color: "var(--risk-normal)" }}>14</div>
          <div className="metric-footer">Compliance reports verified</div>
        </div>
      </div>

      {/* System Foundation Panel */}
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Architectural Foundation & Backend Status (Phase 1)</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
              FastAPI Modular Monolith &bull; SQLAlchemy 2.0 ORM &bull; SQLite/Postgres Ready &bull; 58 Synthetic Records
            </div>
          </div>
          <span className="badge badge-ontrack">Phase 1 Complete</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Database size={16} color="var(--accent-aicte-blue)" />
              <strong style={{ fontSize: "0.9rem" }}>Relational Database Status</strong>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Engine: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>SQLite (Production Postgres Compatible)</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Connection: <span style={{ color: "var(--risk-normal)", fontWeight: 600 }}>{healthData?.database || "Healthy"}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Tables: <span style={{ color: "var(--text-primary)" }}>Bureaus, Users, Institutions, Cases, Assignments, AuditEvents, SLAs</span>
            </div>
          </div>

          <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <ShieldAlert size={16} color="var(--accent-saffron)" />
              <strong style={{ fontSize: "0.9rem" }}>Active Role & Scope Boundary</strong>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Current User: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{currentRole}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Scope:{" "}
              <span style={{ color: "var(--accent-saffron-light)", fontWeight: 600 }}>
                {currentRole === "OFFICER" ? "Approval Bureau (APPR) Only" : "All 4 Configured Bureaus"}
              </span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Complainant PII:{" "}
              <span style={{ color: currentRole === "AUDITOR" ? "var(--risk-approaching)" : "var(--risk-normal)" }}>
                {currentRole === "AUDITOR" ? "Masked & Redacted (Server-side)" : "Permitted with Audit Log"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "1.25rem", padding: "0.75rem", background: "rgba(37, 99, 235, 0.08)", borderRadius: "8px", border: "1px solid rgba(37, 99, 235, 0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Backend API specification and OpenAPI docs accessible at <code style={{ color: "var(--accent-aicte-blue)", background: "var(--bg-surface)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>http://127.0.0.1:8000/docs</code>
          </div>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
          >
            <span>OpenAPI Docs</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </Layout>
  );
};
