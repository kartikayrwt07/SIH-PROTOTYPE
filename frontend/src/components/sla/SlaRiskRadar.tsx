import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Flame,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Building2,
  ArrowUpRight,
  TrendingUp,
  X,
} from "lucide-react";
import { SlaRadarSummary, SlaRadarItem, Bureau } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface SlaRiskRadarProps {
  onSelectCase: (caseRef: string) => void;
}

export const SlaRiskRadar: React.FC<SlaRiskRadarProps> = ({ onSelectCase }) => {
  const { currentRole } = useAuth();
  const [radar, setRadar] = useState<SlaRadarSummary | null>(null);
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [selectedBureau, setSelectedBureau] = useState<string>("");
  const [activeView, setActiveView] = useState<"overdue" | "approaching">("overdue");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Escalation Modal State
  const [escalatingCase, setEscalatingCase] = useState<SlaRadarItem | null>(null);
  const [escalateReason, setEscalateReason] = useState<string>("");
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState<boolean>(false);
  const [escalationError, setEscalationError] = useState<string | null>(null);

  const fetchRadar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getSlaRadar(selectedBureau || undefined);
      if (res.success && res.data) {
        setRadar(res.data);
      } else {
        setError(res.error?.message || "Failed to load SLA Risk Radar.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error contacting radar service");
    } finally {
      setIsLoading(false);
    }
  }, [selectedBureau]);

  useEffect(() => {
    fetchRadar();
  }, [fetchRadar]);

  useEffect(() => {
    api.getBureaus().then((res) => {
      if (res.success && res.data) {
        setBureaus(res.data);
      }
    });
  }, []);

  const handleEscalateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalatingCase) return;
    if (escalateReason.trim().length < 3) {
      setEscalationError("Escalation rationale is mandatory (minimum 3 characters).");
      return;
    }

    setIsSubmittingEscalation(true);
    setEscalationError(null);
    try {
      const res = await api.escalateCase(escalatingCase.case_reference_id, escalateReason.trim());
      if (res.success) {
        setEscalatingCase(null);
        setEscalateReason("");
        fetchRadar();
      } else {
        setEscalationError(res.error?.message || "Failed to escalate case.");
      }
    } catch (err) {
      setEscalationError(err instanceof Error ? err.message : "Error submitting escalation");
    } finally {
      setIsSubmittingEscalation(false);
    }
  };

  const isAuditor = currentRole === "AUDITOR";
  const displayedCases = activeView === "overdue" ? radar?.overdue_cases || [] : radar?.approaching_cases || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header Bar */}
      <div
        className="card-base"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Flame size={22} color="var(--accent-saffron, #f59e0b)" />
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
              SLA Aging & Breach Risk Radar
            </h2>
          </div>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Proactive deadline surveillance across AICTE cells. Detect impending breaches before procedural failure occurs.
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Building2 size={16} color="var(--text-muted)" />
            <select
              value={selectedBureau}
              onChange={(e) => setSelectedBureau(e.target.value)}
              className="filter-input"
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
              }}
            >
              <option value="">All AICTE Bureaus</option>
              {bureaus.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-secondary"
            onClick={fetchRadar}
            disabled={isLoading}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.8rem" }}
            title="Refresh Radar Surveillance"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Risk Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Total Active */}
        <div className="card-base" style={{ padding: "1.1rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Active Cases Under Scope
          </span>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.3rem" }}>
            {radar ? radar.total_active_cases : "—"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-aicte-blue)" }}>
            {radar ? `${radar.on_track_count} within normal SLA` : "Calculating..."}
          </span>
        </div>

        {/* Overdue */}
        <div
          className="card-base"
          style={{
            padding: "1.1rem",
            borderLeft: "4px solid var(--risk-overdue, #ef4444)",
            background: "rgba(239, 68, 68, 0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--risk-overdue, #ef4444)", textTransform: "uppercase" }}>
              Critical Overdue
            </span>
            <AlertTriangle size={18} color="var(--risk-overdue, #ef4444)" />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--risk-overdue, #ef4444)", marginTop: "0.3rem" }}>
            {radar ? radar.overdue_count : "—"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--risk-overdue, #ef4444)" }}>
            Immediate supervisory intervention required
          </span>
        </div>

        {/* Approaching */}
        <div
          className="card-base"
          style={{
            padding: "1.1rem",
            borderLeft: "4px solid var(--risk-approaching, #f59e0b)",
            background: "rgba(245, 158, 11, 0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--risk-approaching, #f59e0b)", textTransform: "uppercase" }}>
              Impending Breaches (&lt;48h)
            </span>
            <Clock size={18} color="var(--risk-approaching, #f59e0b)" />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--risk-approaching, #f59e0b)", marginTop: "0.3rem" }}>
            {radar ? radar.approaching_count : "—"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--risk-approaching, #f59e0b)" }}>
            Watchlist for priority resolution
          </span>
        </div>

        {/* Resolved/Closed */}
        <div className="card-base" style={{ padding: "1.1rem", borderLeft: "4px solid var(--risk-normal, #10b981)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--risk-normal, #10b981)", textTransform: "uppercase" }}>
              Resolved / Concluded
            </span>
            <CheckCircle2 size={18} color="var(--risk-normal, #10b981)" />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.3rem" }}>
            {radar ? radar.completed_count : "—"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--risk-normal, #10b981)" }}>
            Audit preserved lifecycle completions
          </span>
        </div>
      </div>

      {/* Surveillance Queue View Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setActiveView("overdue")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "none",
            background: activeView === "overdue" ? "rgba(239, 68, 68, 0.15)" : "transparent",
            color: activeView === "overdue" ? "var(--risk-overdue, #ef4444)" : "var(--text-secondary)",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <ShieldAlert size={16} />
          Critical Overdue Queue ({radar ? radar.overdue_count : 0})
        </button>

        <button
          onClick={() => setActiveView("approaching")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "none",
            background: activeView === "approaching" ? "rgba(245, 158, 11, 0.15)" : "transparent",
            color: activeView === "approaching" ? "var(--risk-approaching, #f59e0b)" : "var(--text-secondary)",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Clock size={16} />
          Approaching Deadline Watchlist ({radar ? radar.approaching_count : 0})
        </button>
      </div>

      {/* Case Surveillance List */}
      <div className="card-base" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.75rem" }} />
            Evaluating real-time SLA metrics across all active AICTE dockets...
          </div>
        ) : error ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--risk-overdue)" }}>
            {error}
          </div>
        ) : displayedCases.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <CheckCircle2 size={32} color="var(--risk-normal)" style={{ margin: "0 auto 0.75rem" }} />
            <h4 style={{ color: "var(--text-primary)", margin: "0 0 0.25rem 0" }}>
              {activeView === "overdue" ? "Zero Overdue Cases" : "No Cases Approaching Breach"}
            </h4>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              {activeView === "overdue"
                ? "All assigned cases across monitored AICTE bureaus are operating strictly within resolution limits."
                : "No cases are currently within the 48-hour SLA breach alert window."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(15, 23, 42, 0.6)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 600 }}>Case Reference</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 600 }}>Institution & Subject</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 600 }}>Bureau</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 600 }}>Priority</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 600 }}>Aging / Deadline</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 600 }}>Escalation Tier</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedCases.map((item) => {
                  const isOverdue = item.is_overdue;
                  const absHours = item.hours_remaining ? Math.abs(item.hours_remaining) : 0;
                  const days = Math.floor(absHours / 24);
                  const remHours = Math.round(absHours % 24);

                  return (
                    <tr
                      key={item.case_reference_id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        background: isOverdue ? "rgba(239, 68, 68, 0.02)" : "transparent",
                      }}
                    >
                      {/* Case Ref */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <button
                          onClick={() => onSelectCase(item.case_reference_id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--accent-saffron, #f59e0b)",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "0.9rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          {item.case_reference_id}
                          <ArrowUpRight size={12} />
                        </button>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.status}</div>
                      </td>

                      {/* Institution & Subject */}
                      <td style={{ padding: "0.85rem 1rem", maxWidth: "300px" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.subject}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {item.institution_name || "Institution Name Pending"}
                        </div>
                      </td>

                      {/* Bureau */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            background: "rgba(59, 130, 246, 0.1)",
                            color: "var(--accent-aicte-blue)",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                          }}
                        >
                          {item.bureau_code || "AICTE"}
                        </span>
                      </td>

                      {/* Priority */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background:
                              item.priority === "URGENT"
                                ? "rgba(239, 68, 68, 0.15)"
                                : item.priority === "HIGH"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(100, 116, 139, 0.15)",
                            color:
                              item.priority === "URGENT"
                                ? "#ef4444"
                                : item.priority === "HIGH"
                                ? "#f59e0b"
                                : "var(--text-secondary)",
                          }}
                        >
                          {item.priority}
                        </span>
                      </td>

                      {/* Aging / Deadline Badge */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: isOverdue ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: isOverdue ? "#ef4444" : "#f59e0b",
                          }}
                        >
                          {isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
                          {isOverdue
                            ? `${days > 0 ? `${days}d ` : ""}${remHours}h Overdue`
                            : `${days > 0 ? `${days}d ` : ""}${remHours}h Left`}
                        </span>
                      </td>

                      {/* Escalation Level */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: item.escalation_level > 0 ? "#ef4444" : "var(--text-muted)",
                          }}
                        >
                          {item.escalation_level === 0
                            ? "Tier 0 (Standard)"
                            : `Tier ${item.escalation_level} (Escalated)`}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                          {!isAuditor && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => setEscalatingCase(item)}
                              style={{
                                padding: "0.35rem 0.65rem",
                                fontSize: "0.75rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                color: "#ef4444",
                                borderColor: "rgba(239, 68, 68, 0.3)",
                              }}
                              title="Flag for administrative escalation"
                            >
                              <TrendingUp size={12} /> Escalate
                            </button>
                          )}
                          <button
                            className="btn btn-primary"
                            onClick={() => onSelectCase(item.case_reference_id)}
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                          >
                            <ExternalLink size={12} /> Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Escalation Modal */}
      {escalatingCase && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(10, 15, 30, 0.75)",
            backdropFilter: "blur(4px)",
            padding: "1rem",
          }}
          onClick={() => setEscalatingCase(null)}
        >
          <div
            className="card-base"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--card-bg, #111827)",
              border: "1px solid var(--border-color, #1f2937)",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border-color, #1f2937)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <TrendingUp size={20} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Administrative Escalation
                </h3>
              </div>
              <button
                onClick={() => setEscalatingCase(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEscalateSubmit} style={{ padding: "1.5rem" }}>
              {escalationError && (
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "6px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#fca5a5",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                >
                  {escalationError}
                </div>
              )}

              <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Escalating case{" "}
                <strong style={{ fontFamily: "monospace", color: "#60a5fa" }}>
                  {escalatingCase.case_reference_id}
                </strong>{" "}
                from <strong>Tier {escalatingCase.escalation_level}</strong> to{" "}
                <strong style={{ color: "#ef4444" }}>Tier {Math.min(escalatingCase.escalation_level + 1, 3)}</strong>.
              </p>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Escalation Justification <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="State operational rationale for supervisory escalation (e.g. bureau unresponsive, severe statutory delay)..."
                  disabled={isSubmittingEscalation}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #374151)",
                    background: "var(--bg-primary, #1e293b)",
                    color: "var(--text-primary, #f9fafb)",
                    fontSize: "0.875rem",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  padding: "0.75rem",
                  borderRadius: "6px",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px dashed rgba(239, 68, 68, 0.3)",
                  fontSize: "0.75rem",
                  color: "#fca5a5",
                  marginBottom: "1.5rem",
                }}
              >
                Escalation triggers priority surveillance on the National Portal and logs an immutable{" "}
                <code>ESCALATED</code> audit record.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setEscalatingCase(null)}
                  disabled={isSubmittingEscalation}
                  style={{
                    padding: "0.55rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #374151)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEscalation || escalateReason.trim().length < 3}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "6px",
                    border: "none",
                    background: isSubmittingEscalation || escalateReason.trim().length < 3 ? "#374151" : "#ef4444",
                    color: "#ffffff",
                    fontWeight: 600,
                    cursor:
                      isSubmittingEscalation || escalateReason.trim().length < 3 ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmittingEscalation ? "Escalating..." : "Confirm Escalation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
