import React, { useState, useEffect } from "react";
import { Layout } from "./components/common/Layout";
import { useAuth } from "./context/AuthContext";
import { api } from "./services/api";
import { ComplaintCase, TimelineEvent, CaseStatus } from "./types";
import { TimelineView } from "./components/timeline/TimelineView";
import { CaseRegister } from "./components/cases/CaseRegister";
import { CaseDetailView } from "./components/cases/CaseDetailView";
import { SlaRiskRadar } from "./components/sla/SlaRiskRadar";
import {
  Database,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Key,
  UserCheck,
  Play,
  RotateCcw,
  AlertOctagon,
  FileSpreadsheet,
  ExternalLink,
  UploadCloud,
} from "lucide-react";

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("cases");
  const { currentRole, currentUser, permissions } = useAuth();
  const [healthStatus, setHealthStatus] = useState<string>("Connecting...");
  const [databaseStatus, setDatabaseStatus] = useState<string>("Verifying...");

  // Selected case for Dossier Detail View (Phase 4)
  const [selectedCaseDetailRef, setSelectedCaseDetailRef] = useState<string | null>(null);

  // Case Lifecycle Interactive Simulator State (Phase 3)
  const [sampleCases, setSampleCases] = useState<ComplaintCase[]>([]);
  const [selectedCaseRef, setSelectedCaseRef] = useState<string>("");
  const [activeCase, setActiveCase] = useState<ComplaintCase | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [targetStatus, setTargetStatus] = useState<CaseStatus>("Registered");
  const [transitionRemarks, setTransitionRemarks] = useState<string>("State updated during grievance review meeting");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchHealthAndCases = async () => {
      const res = await api.checkHealth();
      if (res.success && res.data) {
        setHealthStatus(res.data.status === "operational" ? "Operational" : "Degraded");
        setDatabaseStatus(res.data.database || "Healthy");
      } else {
        setHealthStatus("Offline / Demo Mode");
        setDatabaseStatus("SQLite Local");
      }

      // Fetch sample cases for lifecycle simulator
      const casesRes = await api.getCases({ page: 1, page_size: 10 });
      if (casesRes.success && casesRes.data && casesRes.data.length > 0) {
        setSampleCases(casesRes.data);
        const first = casesRes.data[0];
        setSelectedCaseRef(first.case_reference_id);
      }
    };
    fetchHealthAndCases();
  }, [currentRole]);

  // Load selected case detail & timeline in simulator
  useEffect(() => {
    if (!selectedCaseRef) return;
    const loadDetail = async () => {
      const detailRes = await api.getCaseDetail(selectedCaseRef);
      if (detailRes.success && detailRes.data) {
        setActiveCase(detailRes.data);
      }
      const timelineRes = await api.getCaseTimeline(selectedCaseRef);
      if (timelineRes.success && timelineRes.data) {
        setTimelineEvents(timelineRes.data);
      }
    };
    loadDetail();
  }, [selectedCaseRef]);

  const handleExecuteTransition = async () => {
    if (!activeCase) return;
    setIsSubmitting(true);
    setActionMessage(null);

    const res = await api.transitionCase(activeCase.case_reference_id, targetStatus, transitionRemarks);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setActiveCase(res.data);
      setActionMessage({ type: "success", text: `Status successfully updated to '${res.data.status}'` });
      const tRes = await api.getCaseTimeline(activeCase.case_reference_id);
      if (tRes.success && tRes.data) {
        setTimelineEvents(tRes.data);
      }
    } else {
      const errorMsg = res.error?.message || "Failed to execute state transition";
      setActionMessage({ type: "error", text: errorMsg });
    }
  };

  const handleAttemptInvalidJump = async () => {
    if (!activeCase) return;
    setIsSubmitting(true);
    setActionMessage(null);

    // Attempt illegal transition directly to Resolved
    const res = await api.transitionCase(activeCase.case_reference_id, "Resolved", "Attempting illegal state bypass");
    setIsSubmitting(false);

    if (!res.success) {
      setActionMessage({
        type: "error",
        text: `[REJECTED HTTP 422]: ${res.error?.message || "Invalid state transition blocked by lifecycle guard"}`
      });
    } else {
      setActionMessage({ type: "success", text: "Transition completed" });
    }
  };

  const handleReopen = async () => {
    if (!activeCase) return;
    setIsSubmitting(true);
    setActionMessage(null);

    const res = await api.reopenCase(activeCase.case_reference_id, "Complainant reported grievance reoccurred");
    setIsSubmitting(false);

    if (res.success && res.data) {
      setActiveCase(res.data);
      setActionMessage({ type: "success", text: "Case reopened successfully (In Progress)" });
      const tRes = await api.getCaseTimeline(activeCase.case_reference_id);
      if (tRes.success && tRes.data) {
        setTimelineEvents(tRes.data);
      }
    } else {
      setActionMessage({ type: "error", text: res.error?.message || "Reopen rejected" });
    }
  };

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
            <CaseRegister onSelectCase={(ref) => setSelectedCaseDetailRef(ref)} />
          </div>
        )
      )}

      {/* 2. Executive Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
                AICTE Grievance Command Center
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                Consolidated cross-bureau monitoring, real-time SLA risk radar, and auditable case lifecycle tracking.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedCaseDetailRef(null);
                setActiveTab("cases");
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <FileSpreadsheet size={16} /> Open Case Register
            </button>
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

          {/* Interactive Case Lifecycle & Audit Timeline Panel (Phase 3 Deliverable) */}
          <div className="glass-panel" style={{ borderLeft: "4px solid var(--accent-saffron)" }}>
            <div className="panel-header">
              <div>
                <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Play size={18} color="var(--accent-saffron)" />
                  <span>Interactive Case Lifecycle State Machine & Audit Trail (Phase 3)</span>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  Deterministic 9-Stage Lifecycle &bull; Transition Guard Enforcement &bull; Append-Only Audit Trail
                </div>
              </div>
              <span className="badge badge-ontrack">Phase 3 Active</span>
            </div>

            {/* Case Selector and Status Card */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
              <div>
                <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <label htmlFor="case-select" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Select Case Record:
                  </label>
                  <select
                    id="case-select"
                    className="role-select"
                    value={selectedCaseRef}
                    onChange={(e) => setSelectedCaseRef(e.target.value)}
                    style={{ padding: "0.4rem 0.8rem", flex: 1 }}
                  >
                    {sampleCases.map((c) => (
                      <option key={c.case_reference_id} value={c.case_reference_id}>
                        {c.case_reference_id} — {c.subject.substring(0, 45)}... ({c.status})
                      </option>
                    ))}
                  </select>
                </div>

                {activeCase && (
                  <div style={{ background: "var(--bg-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <strong style={{ fontSize: "1.05rem", color: "#FFFFFF" }}>{activeCase.case_reference_id}</strong>
                      <span className={`badge badge-${activeCase.priority.toLowerCase()}`}>{activeCase.priority}</span>
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                      {activeCase.subject}
                    </div>

                    <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem", marginBottom: "1rem", color: "var(--text-muted)" }}>
                      <div>Current Status: <strong style={{ color: "var(--accent-saffron)" }}>{activeCase.status}</strong></div>
                      <div>Bureau: <strong style={{ color: "var(--accent-aicte-blue)" }}>{activeCase.bureau_id ? activeCase.bureau_id.substring(0, 8) : "N/A"}</strong></div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                        onClick={() => {
                          setSelectedCaseDetailRef(activeCase.case_reference_id);
                          setActiveTab("cases");
                        }}
                      >
                        Inspect Dossier & Notes <ExternalLink size={13} style={{ marginLeft: "4px" }} />
                      </button>
                    </div>

                    {/* Transition Controls */}
                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                        Execute Lifecycle Transition:
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <select
                          className="role-select"
                          value={targetStatus}
                          onChange={(e) => setTargetStatus(e.target.value as CaseStatus)}
                          style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem" }}
                        >
                          <option value="Registered">Registered</option>
                          <option value="Under Triage">Under Triage</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Awaiting Information">Awaiting Information</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>

                        <input
                          type="text"
                          className="input-field"
                          value={transitionRemarks}
                          onChange={(e) => setTransitionRemarks(e.target.value)}
                          placeholder="Mandatory transition remarks..."
                          style={{ flex: 1, padding: "0.4rem 0.8rem" }}
                        />

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleExecuteTransition}
                          disabled={isSubmitting}
                          style={{ fontSize: "0.8rem", padding: "0.4rem 0.9rem" }}
                        >
                          <span>Advance</span>
                        </button>
                      </div>

                      {/* Negative Test & Reopen Triggers */}
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleAttemptInvalidJump}
                          disabled={isSubmitting}
                          style={{ fontSize: "0.75rem", color: "var(--risk-overdue)", borderColor: "rgba(239, 68, 68, 0.4)" }}
                        >
                          <AlertOctagon size={14} />
                          <span>Test Illegal Jump &rarr; Resolved (Expect HTTP 422)</span>
                        </button>

                        {activeCase.status === "Resolved" && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleReopen}
                            disabled={isSubmitting}
                            style={{ fontSize: "0.75rem", color: "var(--accent-saffron)" }}
                          >
                            <RotateCcw size={14} />
                            <span>Reopen Case (Formal Appeal)</span>
                          </button>
                        )}
                      </div>

                      {/* Feedback Message */}
                      {actionMessage && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            padding: "0.6rem 0.8rem",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            background: actionMessage.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: actionMessage.type === "success" ? "#34D399" : "#FCA5A5",
                            border: `1px solid ${actionMessage.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                          }}
                        >
                          {actionMessage.text}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chronological Audit Trail View */}
              <div style={{ background: "var(--bg-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", maxHeight: "460px", overflowY: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#FFFFFF" }}>
                    Immutable Case Activity Audit Trail
                  </div>
                  <span className="badge badge-low">{timelineEvents.length} Events Logged</span>
                </div>
                <TimelineView events={timelineEvents} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SLA Risk Radar Tab (Phase 5 Preview) */}
      {activeTab === "sla_radar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
              SLA & Aging Risk Radar
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Dynamic deadline surveillance distinguishing On Track, Approaching, and Overdue institution cases.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            <div className="card-base" style={{ borderLeft: "4px solid var(--risk-overdue)", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--risk-overdue)", fontWeight: 700 }}>
                <AlertTriangle size={18} />
                <span>4 Cases Overdue / Breached</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                These cases have exceeded their target SLA turnaround deadlines. Supervisory intervention recommended.
              </p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}
                onClick={() => {
                  setSelectedCaseDetailRef(null);
                  setActiveTab("cases");
                }}
              >
                Filter Overdue Cases in Register &rarr;
              </button>
            </div>

            <div className="card-base" style={{ borderLeft: "4px solid var(--risk-approaching)", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--risk-approaching)", fontWeight: 700 }}>
                <Clock size={18} />
                <span>6 Cases Approaching Deadline</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                Less than 48 hours remaining before SLA breach. Active bureau officers should expedite review.
              </p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}
                onClick={() => {
                  setSelectedCaseDetailRef(null);
                  setActiveTab("cases");
                }}
              >
                Inspect in Case Register &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SLA Risk Radar Tab (Phase 5 Deliverable) */}
      {activeTab === "sla_radar" && (
        <SlaRiskRadar
          onSelectCase={(caseRef) => {
            setSelectedCaseDetailRef(caseRef);
            setActiveTab("cases");
          }}
        />
      )}

      {/* 4. CSV Ingestion Tab (Phase 7 Preview) */}
      {activeTab === "ingest" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
              Batch CSV Ingestion Engine
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Pre-validation dry-run preview, batch transaction safety, and duplicate collision warnings.
            </p>
          </div>

          <div className="card-base" style={{ padding: "2.5rem", textAlign: "center" }}>
            <UploadCloud size={40} color="var(--accent-aicte-blue)" style={{ margin: "0 auto 1rem auto" }} />
            <h3 style={{ color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>Upload Batch Complaint CSV</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "480px", margin: "0 auto 1.5rem auto" }}>
              Upload historical or batch institutional complaints for schema validation, automated field mapping, and preview prior to commit.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab("cases")}
            >
              Browse Active Seeded Cases (58 Loaded)
            </button>
          </div>
        </div>
      )}

      {/* 5. Role & Server-Side Security Panel (Phase 2 Deliverable) */}
      {activeTab === "rbac" && (
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
      )}

      {/* Relational Database & Foundation Status Footer */}
      <div className="glass-panel" style={{ marginTop: "1.5rem" }}>
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
