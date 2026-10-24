import React, { useState } from "react";
import { X, ArrowRight, AlertCircle, CheckCircle2, Lock, RefreshCw } from "lucide-react";
import { CaseStatus, ComplaintCase } from "../../types";
import { api } from "../../services/api";

interface CaseTransitionModalProps {
  currentCase: ComplaintCase;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCase: ComplaintCase) => void;
}

const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  Received: ["Registered", "Rejected"],
  Registered: ["Under Triage", "Rejected"],
  "Under Triage": ["Assigned", "Rejected"],
  Assigned: ["In Progress", "Rejected"],
  "In Progress": ["Awaiting Information", "Under Review", "Rejected"],
  "Awaiting Information": ["In Progress", "Rejected"],
  "Under Review": ["In Progress", "Resolved", "Rejected"],
  Resolved: ["Closed", "In Progress"],
  Closed: [],
  Rejected: [],
};

export const CaseTransitionModal: React.FC<CaseTransitionModalProps> = ({
  currentCase,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const allowedNext = ALLOWED_TRANSITIONS[currentCase.status] || [];
  const [selectedNext, setSelectedNext] = useState<CaseStatus | "">(
    allowedNext.length > 0 ? allowedNext[0] : ""
  );
  const [remarks, setRemarks] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isReopen = currentCase.status === "Resolved" && selectedNext === "In Progress";
  const isClosing = selectedNext === "Closed";
  const isRejecting = selectedNext === "Rejected";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNext) {
      setError("Please select a target status.");
      return;
    }
    if (remarks.trim().length < 3) {
      setError("Remarks must be at least 3 characters explaining the transition rationale.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let res;
      if (isReopen) {
        res = await api.reopenCase(currentCase.case_reference_id, remarks.trim());
      } else {
        res = await api.transitionCase(
          currentCase.case_reference_id,
          selectedNext as CaseStatus,
          remarks.trim()
        );
      }

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setError(res.error?.message || "Failed to execute transition.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error executing state change");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        className="card-base"
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--border-subtle)",
          position: "relative",
          padding: "1.5rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "0.75rem",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {isReopen ? "Reopen Case Dossier" : "Advance Case Lifecycle"}
            </h3>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Case Ref: <strong style={{ color: "var(--accent-saffron)" }}>{currentCase.case_reference_id}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              background: "rgba(239, 68, 68, 0.15)",
              color: "var(--risk-overdue)",
              borderRadius: "4px",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {allowedNext.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)" }}>
            <Lock size={32} style={{ margin: "0 auto 0.5rem auto", opacity: 0.5 }} />
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              Case is in terminal state ({currentCase.status})
            </div>
            <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Closed cases cannot be modified or transitioned further.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Current vs Next State */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                background: "rgba(15, 23, 42, 0.5)",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Current Status
                </div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>
                  {currentCase.status}
                </div>
              </div>
              <ArrowRight size={18} color="var(--accent-saffron)" />
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Target Next State
                </div>
                <select
                  className="select-field"
                  style={{ marginTop: "2px", fontWeight: 600 }}
                  value={selectedNext}
                  onChange={(e) => setSelectedNext(e.target.value as CaseStatus)}
                >
                  {allowedNext.map((st) => (
                    <option key={st} value={st}>
                      {st === "Rejected" ? "Rejected (Spam / Malformed)" : st}{" "}
                      {currentCase.status === "Resolved" && st === "In Progress" ? "(Reopen)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Special notices */}
            {isRejecting && (
              <div
                style={{
                  padding: "0.6rem 0.8rem",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  color: "#EF4444",
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                }}
              >
                <AlertCircle size={15} color="#EF4444" />
                Rejecting quarantines this complaint as spam/malformed. It will NOT pollute Average Resolution Time (MTTR) or Resolution Rate KPIs.
              </div>
            )}

            {isClosing && (
              <div
                style={{
                  padding: "0.6rem 0.8rem",
                  background: "rgba(148, 163, 184, 0.1)",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                }}
              >
                <Lock size={15} color="var(--text-muted)" />
                Closing this case marks it strictly terminal. No further edits will be permitted.
              </div>
            )}

            {isReopen && (
              <div
                style={{
                  padding: "0.6rem 0.8rem",
                  background: "rgba(245, 158, 11, 0.12)",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  color: "var(--risk-approaching)",
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                }}
              >
                <RefreshCw size={15} />
                Reopening will reset resolution timestamps and log a formal REOPENED audit event.
              </div>
            )}

            {/* Mandatory Remarks */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.35rem",
                }}
              >
                Transition Remarks / Sign-off Rationale <span style={{ color: "var(--risk-overdue)" }}>*</span>
              </label>
              <textarea
                className="input-field"
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
                placeholder="Enter mandatory justification or procedural remarks (recorded in immutable audit trail)..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                required
              />
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Minimum 3 characters. This rationale will be permanently attributed to your user identity.
              </div>
            </div>

            {/* Footer Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "0.5rem",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "1rem",
              }}
            >
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || remarks.trim().length < 3}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: isRejecting ? "#EF4444" : undefined,
                  borderColor: isRejecting ? "#DC2626" : undefined,
                }}
              >
                {isSubmitting ? (
                  "Recording..."
                ) : isReopen ? (
                  <>
                    <RefreshCw size={15} /> Reopen Case
                  </>
                ) : isRejecting ? (
                  <>
                    <AlertCircle size={15} /> Reject & Quarantine Spam
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} /> Confirm Transition
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
