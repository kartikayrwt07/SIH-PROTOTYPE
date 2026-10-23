import React, { useState, useEffect } from "react";
import { Layout } from "./components/common/Layout";
import { useAuth } from "./context/AuthContext";
import { api } from "./services/api";
import { Database, ShieldAlert, Clock, CheckCircle2, AlertTriangle, Layers, ArrowUpRight, Key, UserCheck } from "lucide-react";

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { currentRole, currentUser, permissions } = useAuth();
  const [healthStatus, setHealthStatus] = useState<string>("Connecting...");
  const [databaseStatus, setDatabaseStatus] = useState<string>("Verifying...");

  useEffect(() => {
    const fetchHealth = async () => {
      const res = await api.checkHealth();
      if (res.success && res.data) {
        setHealthStatus(res.data.status === "operational" ? "Operational" : "Degraded");
        setDatabaseStatus(res.data.database || "Healthy");
      } else {
        setHealthStatus("Offline / Demo Mode");
        setDatabaseStatus("SQLite Local");
      }
    };
    fetchHealth();
  }, []);

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
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

      {/* Role & Server-Side Security Panel (Phase 2 Deliverable) */}
      <div className="glass-panel" style={{ borderLeft: "4px solid var(--accent-aicte-blue)" }}>
        <div className="panel-header">
          <div>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Key size={18} color="var(--accent-saffron)" />
              <span>Server-Side RBAC & Bureau Jurisdiction Enforcement (Phase 2)</span>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
              Dynamic Role Identity &bull; Bureau Jurisdiction Scoping &bull; Insecure Direct Object Reference (IDOR) Protection
            </div>
          </div>
          <span className="badge badge-ontrack">Phase 2 Active</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div style={{ background: "var(--bg-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <UserCheck size={18} color="var(--accent-aicte-blue)" />
              <strong style={{ fontSize: "0.95rem" }}>Authenticated Profile</strong>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              User: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{currentUser?.full_name || "Central Administrator"}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
              Email: <span style={{ color: "var(--text-primary)" }}>{currentUser?.email || "admin@aicte-demo.gov.in"}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
              Assigned Bureau:{" "}
              <span style={{ color: "var(--accent-saffron-light)", fontWeight: 600 }}>
                {currentUser?.bureau_name ? `${currentUser.bureau_name} (${currentUser.bureau_code})` : "Universal (All Bureaus)"}
              </span>
            </div>
          </div>

          <div style={{ background: "var(--bg-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <ShieldAlert size={18} color="var(--accent-saffron)" />
              <strong style={{ fontSize: "0.95rem" }}>Role-Level Security Gates</strong>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Active Role: <span className="badge badge-medium">{currentRole}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
              Jurisdiction:{" "}
              <strong style={{ color: currentRole === "OFFICER" ? "var(--risk-approaching)" : "var(--risk-normal)" }}>
                {currentRole === "OFFICER" ? "Restricted (IDOR Protected: APPR cases only)" : "Universal Cross-Bureau Access"}
              </strong>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
              Complainant PII:{" "}
              <strong style={{ color: currentRole === "AUDITOR" ? "var(--risk-approaching)" : "var(--risk-normal)" }}>
                {currentRole === "AUDITOR" ? "Server-Redacted / Masked" : "Permitted with Audit Log"}
              </strong>
            </div>
          </div>
        </div>

        {/* Permissions Badges */}
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>
            GRANTED SERVER-SIDE CAPABILITIES:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {permissions.length > 0 ? (
              permissions.map((p) => (
                <span
                  key={p}
                  style={{
                    background: "rgba(37, 99, 235, 0.15)",
                    color: "var(--accent-aicte-blue)",
                    border: "1px solid rgba(37, 99, 235, 0.3)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {p}
                </span>
              ))
            ) : (
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Loading permissions...</span>
            )}
          </div>
        </div>
      </div>

      {/* Relational Database & Foundation Status */}
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Relational Database Engine & Data Integrity</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
              SQLite Local Persistence &bull; PostgreSQL Production Compatibility &bull; Automated Alembic Schemas
            </div>
          </div>
          <span className="badge badge-ontrack">Verified Healthy</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-surface)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Database size={20} color="var(--accent-aicte-blue)" />
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>aicte_complaints.db ({databaseStatus})</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                58 Synthetic Cases &bull; 4 Bureaus &bull; 7 Users &bull; 15 Institutions &bull; 6 SLA Policies &bull; Foreign Key Enforcement
              </div>
            </div>
          </div>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
          >
            <span>OpenAPI Docs</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </Layout>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};
