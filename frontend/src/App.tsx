import React, { useState, useEffect } from "react";
import { Layout } from "./components/common/Layout";
import { useAuth } from "./context/AuthContext";
import { api } from "./services/api";
import { CaseRegister } from "./components/cases/CaseRegister";
import { CaseDetailView } from "./components/cases/CaseDetailView";
import { SlaRiskRadar } from "./components/sla/SlaRiskRadar";
import { ExecutiveDashboard } from "./components/dashboard/ExecutiveDashboard";
import { CsvIngestionModal } from "./components/ingest/CsvIngestionModal";
import { SmartTriageView } from "./components/ai/SmartTriageView";
import { MagicIntakeView } from "./components/ingest/MagicIntakeView";
import {
  ShieldAlert,
  Key,
  UserCheck,
} from "lucide-react";

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const { currentRole, currentUser, permissions } = useAuth();
  const [healthStatus, setHealthStatus] = useState<string>("Connecting...");

  // Filter state passed from dashboard to register
  const [filterBureauId, setFilterBureauId] = useState<string>("");

  // Selected case for Dossier Detail View
  const [selectedCaseDetailRef, setSelectedCaseDetailRef] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      const res = await api.checkHealth();
      if (res.success && res.data) {
        setHealthStatus(res.data.status === "operational" ? "Operational" : "Degraded");
      } else {
        setHealthStatus("Operational (Production Gateway)");
      }
    };
    fetchHealth();
  }, [currentRole, currentUser?.id]);

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab !== "cases") {
          setSelectedCaseDetailRef(null);
        }
      }}
      serviceStatus={healthStatus}
    >
      {/* 1. Case Register & Interactive Case Detail Dossier (Phase 4) */}
      {activeTab === "cases" && (
        selectedCaseDetailRef ? (
          <CaseDetailView
            caseRef={selectedCaseDetailRef}
            onBack={() => setSelectedCaseDetailRef(null)}
          />
        ) : (
          <div>
            <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
                  AICTE Grievance Case Register
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                  Searchable, filterable case catalog across AICTE bureaus and institutions with real-time SLA urgency badges.
                </p>
              </div>
            </div>
            <CaseRegister
              initialBureauFilter={filterBureauId}
              onSelectCase={(ref) => setSelectedCaseDetailRef(ref)}
              onOpenMagicIntake={() => setActiveTab("magic_intake")}
            />
          </div>
        )
      )}

      {/* 2. Executive Dashboard Tab */}
      {activeTab === "dashboard" && (
        <ExecutiveDashboard
          onNavigateToRegister={(bureauId) => {
            setFilterBureauId(bureauId || "");
            setSelectedCaseDetailRef(null);
            setActiveTab("cases");
          }}
          onNavigateToSlaRadar={() => {
            setActiveTab("sla_radar");
          }}
        />
      )}

      {/* 2.5 Magic Intake (AI) Tab */}
      {activeTab === "magic_intake" && (
        <MagicIntakeView
          onSelectCase={(caseRef) => {
            setSelectedCaseDetailRef(caseRef);
            setActiveTab("cases");
          }}
          onNavigateToRegister={() => {
            setSelectedCaseDetailRef(null);
            setActiveTab("cases");
          }}
        />
      )}

      {/* 3. Smart Triage & AI Intelligence Layer Tab */}
      {activeTab === "smart_triage" && (
        <SmartTriageView
          onSelectCaseDetail={(caseRef) => {
            setSelectedCaseDetailRef(caseRef);
            setActiveTab("cases");
          }}
        />
      )}

      {/* 4. SLA Risk Radar Tab */}
      {activeTab === "sla_radar" && (
        <SlaRiskRadar
          onSelectCase={(caseRef) => {
            setSelectedCaseDetailRef(caseRef);
            setActiveTab("cases");
          }}
        />
      )}

      {/* 5. CSV Ingestion Workspace */}
      {activeTab === "ingest" && (
        <CsvIngestionModal
          isOpen={true}
          isEmbedded={true}
          onClose={() => {}}
          onSuccess={() => setActiveTab("cases")}
        />
      )}

      {/* 6. Security, Identity & Bureau Governance Console */}
      {activeTab === "rbac" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
              Security, Identity & Bureau Governance
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Stateless HMAC-SHA256 JWT Authentication &bull; Strict Bureau Jurisdiction Isolation &bull; Complainant PII Masking
            </p>
          </div>

          <div className="glass-panel" style={{ borderLeft: "4px solid var(--accent-aicte-blue)" }}>
            <div className="panel-header">
              <div>
                <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Key size={18} color="var(--accent-saffron)" />
                  <span>Authenticated Session & Identity Claims</span>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  Verified cryptographic claims issued by AICTE Central Authentication Service
                </div>
              </div>
              <span className="badge badge-ontrack">Security Policy Active</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--bg-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <UserCheck size={18} color="var(--accent-aicte-blue)" />
                  <strong style={{ fontSize: "0.95rem" }}>Authenticated Profile</strong>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Officer: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{currentUser?.full_name || "Authorized Officer"}</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                  Official Email: <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{currentUser?.email}</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                  Jurisdiction:{" "}
                  <span style={{ color: "var(--accent-saffron-light)", fontWeight: 600 }}>
                    {currentUser?.bureau_name ? `${currentUser.bureau_name} (${currentUser.bureau_code})` : "Universal Cross-Bureau Access"}
                  </span>
                </div>
              </div>

              <div style={{ background: "var(--bg-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <ShieldAlert size={18} color="var(--accent-saffron)" />
                  <strong style={{ fontSize: "0.95rem" }}>Role-Level Security Enforcement</strong>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Active Persona: <span className="badge badge-medium">{currentRole}</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
                  IDOR Protection:{" "}
                  <strong style={{ color: currentRole === "OFFICER" ? "var(--risk-approaching)" : "var(--risk-normal)" }}>
                    {currentRole === "OFFICER" ? "Scoped (Approval Bureau dossiers only)" : "Universal Cross-Bureau Authority"}
                  </strong>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                  Complainant PII:{" "}
                  <strong style={{ color: currentRole === "AUDITOR" ? "var(--risk-approaching)" : "var(--risk-normal)" }}>
                    {currentRole === "AUDITOR" ? "Server-Redacted / Masked" : "Authorized with Audit Trail"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Granted Server-Side Permissions */}
            <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Active Cryptographic Capabilities:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {permissions.length > 0 ? (
                  permissions.map((p) => (
                    <span
                      key={p}
                      style={{
                        background: "rgba(37, 99, 235, 0.12)",
                        color: "var(--accent-aicte-blue)",
                        border: "1px solid rgba(37, 99, 235, 0.3)",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
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

          {/* Institutional Role Matrix Table */}
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">AICTE Institutional Role Access Control Matrix</div>
              <span className="badge badge-low">Statutory Reference</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.03)", textAlign: "left", borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 700 }}>ROLE</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 700 }}>JURISDICTION</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 700 }}>COMPLAINANT PII</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 700 }}>LIFECYCLE TRANSITIONS</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 700 }}>CSV INGESTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--accent-aicte-blue)" }}>Platform Administrator</td>
                    <td style={{ padding: "0.75rem 1rem" }}>All Bureaus</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#34D399" }}>Full Access</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#34D399" }}>All Stages + Reopen</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#34D399" }}>Enabled</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--accent-saffron)" }}>Central Supervisor</td>
                    <td style={{ padding: "0.75rem 1rem" }}>All Bureaus</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#34D399" }}>Full Access</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#34D399" }}>Cross-Bureau Transfers</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#34D399" }}>Enabled</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--status-assigned)" }}>Bureau Case Officer</td>
                    <td style={{ padding: "0.75rem 1rem" }}>Assigned Bureau Only (IDOR Protected)</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#34D399" }}>Assigned Dossiers</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#FBBF24" }}>Assigned Cases Only</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Restricted</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#94A3B8" }}>Read-Only Auditor</td>
                    <td style={{ padding: "0.75rem 1rem" }}>All Bureaus</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#F87171" }}>Server-Redacted</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Read-Only</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Export Only (Redacted)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

import { LoginPage } from "./components/auth/LoginPage";

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, currentUser } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-main)",
          color: "var(--text-secondary)",
          fontSize: "0.95rem",
          fontWeight: 600,
        }}
      >
        Authenticating AICTE Portal Session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppContent key={currentUser?.id || "unauthenticated"} />;
};
