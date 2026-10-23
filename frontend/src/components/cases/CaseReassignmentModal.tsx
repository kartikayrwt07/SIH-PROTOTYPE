import React, { useState, useEffect } from "react";
import { X, ArrowRightLeft, AlertCircle, Building2, User as UserIcon, Check } from "lucide-react";
import { ComplaintCase, Bureau, UserSummary } from "../../types";
import { api } from "../../services/api";

interface CaseReassignmentModalProps {
  currentCase: ComplaintCase;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCase: ComplaintCase) => void;
}

export const CaseReassignmentModal: React.FC<CaseReassignmentModalProps> = ({
  currentCase,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [targetBureauId, setTargetBureauId] = useState<string>(currentCase.bureau_id);
  const [officers, setOfficers] = useState<UserSummary[]>([]);
  const [targetOfficerId, setTargetOfficerId] = useState<string>(currentCase.assigned_officer_id || "");
  const [reason, setReason] = useState<string>("");
  const [isLoadingBureaus, setIsLoadingBureaus] = useState<boolean>(false);
  const [isLoadingOfficers, setIsLoadingOfficers] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load bureaus on open
  useEffect(() => {
    if (!isOpen) return;
    setTargetBureauId(currentCase.bureau_id);
    setTargetOfficerId(currentCase.assigned_officer_id || "");
    setReason("");
    setError(null);

    const fetchBureaus = async () => {
      setIsLoadingBureaus(true);
      try {
        const res = await api.getBureaus();
        if (res.success && res.data) {
          setBureaus(res.data);
        }
      } catch (err) {
        console.error("Failed to load bureaus:", err);
      } finally {
        setIsLoadingBureaus(false);
      }
    };

    fetchBureaus();
  }, [isOpen, currentCase]);

  // Load officers whenever target bureau changes
  useEffect(() => {
    if (!isOpen || !targetBureauId) return;

    const fetchOfficers = async () => {
      setIsLoadingOfficers(true);
      try {
        const res = await api.getBureauOfficers(targetBureauId);
        if (res.success && res.data) {
          setOfficers(res.data);
        } else {
          setOfficers([]);
        }
      } catch (err) {
        console.error("Failed to fetch bureau officers:", err);
        setOfficers([]);
      } finally {
        setIsLoadingOfficers(false);
      }
    };

    fetchOfficers();
  }, [isOpen, targetBureauId]);

  if (!isOpen) return null;

  const currentBureau = bureaus.find((b) => b.id === currentCase.bureau_id) || currentCase.bureau;
  const targetBureau = bureaus.find((b) => b.id === targetBureauId);

  const isBureauChanged = targetBureauId !== currentCase.bureau_id;
  const isOfficerChanged = (targetOfficerId || "") !== (currentCase.assigned_officer_id || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBureauId) {
      setError("Please select a target bureau.");
      return;
    }
    if (!isBureauChanged && !isOfficerChanged) {
      setError("Please select a different bureau or assign a new officer to proceed with transfer.");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Transfer justification is mandatory (minimum 3 characters) for procedural audit compliance.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.assignCase(
        currentCase.case_reference_id,
        targetBureauId,
        targetOfficerId || undefined,
        reason.trim()
      );

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setError(res.error?.message || "Failed to complete case assignment transfer.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error during transfer");
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
          maxWidth: "580px",
          background: "var(--card-bg, #111827)",
          border: "1px solid var(--border-color, #1f2937)",
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-color, #1f2937)",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(59, 130, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3b82f6",
              }}
            >
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary, #f9fafb)" }}>
                Bureau Delegation & Case Transfer
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary, #9ca3af)" }}>
                Ref: <span style={{ fontFamily: "monospace", color: "#60a5fa" }}>{currentCase.case_reference_id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary, #9ca3af)",
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "6px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Current State Summary */}
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "rgba(30, 41, 59, 0.4)",
            borderBottom: "1px solid var(--border-color, #1f2937)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            fontSize: "0.85rem",
          }}
        >
          <div>
            <span style={{ color: "var(--text-secondary, #9ca3af)", display: "block", fontSize: "0.75rem" }}>
              Current Bureau
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
              <Building2 size={14} color="#3b82f6" />
              <strong style={{ color: "#f3f4f6" }}>
                {currentBureau?.code || "UNASSIGNED"}
              </strong>
              <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>({currentBureau?.name})</span>
            </div>
          </div>
          <div>
            <span style={{ color: "var(--text-secondary, #9ca3af)", display: "block", fontSize: "0.75rem" }}>
              Current Officer
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
              <UserIcon size={14} color="#10b981" />
              <strong style={{ color: "#f3f4f6" }}>
                {currentCase.assigned_officer?.full_name || "Unassigned"}
              </strong>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                borderRadius: "6px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Destination Bureau Selection */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-primary, #f9fafb)",
                marginBottom: "0.4rem",
              }}
            >
              Destination Bureau / Cell <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              value={targetBureauId}
              onChange={(e) => {
                setTargetBureauId(e.target.value);
                setTargetOfficerId(""); // Reset officer when bureau switches
              }}
              disabled={isLoadingBureaus || isSubmitting}
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #374151)",
                background: "var(--bg-primary, #1e293b)",
                color: "var(--text-primary, #f9fafb)",
                fontSize: "0.875rem",
              }}
            >
              {bureaus.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name} {b.id === currentCase.bureau_id ? "(Current)" : ""}
                </option>
              ))}
            </select>
            {targetBureau && targetBureau.description && (
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
                {targetBureau.description}
              </p>
            )}
          </div>

          {/* Destination Officer Selection */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-primary, #f9fafb)",
                marginBottom: "0.4rem",
              }}
            >
              Assign Case Officer
            </label>
            <select
              value={targetOfficerId}
              onChange={(e) => setTargetOfficerId(e.target.value)}
              disabled={isLoadingOfficers || isSubmitting}
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #374151)",
                background: "var(--bg-primary, #1e293b)",
                color: "var(--text-primary, #f9fafb)",
                fontSize: "0.875rem",
              }}
            >
              <option value="">— Unassigned (Bureau General Queue) —</option>
              {officers.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.full_name} ({off.role})
                </option>
              ))}
            </select>
            {isLoadingOfficers && (
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#60a5fa" }}>
                Loading officers for {targetBureau?.code}...
              </p>
            )}
          </div>

          {/* Transfer Rationale (Mandatory) */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <label
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-primary, #f9fafb)",
                }}
              >
                Transfer Rationale & Justification <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <span style={{ fontSize: "0.75rem", color: reason.length >= 3 ? "#10b981" : "#9ca3af" }}>
                {reason.length} / min 3 chars
              </span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State reason for jurisdictional reassignment (e.g. specialized approval defect, regional committee inspection required)..."
              disabled={isSubmitting}
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

          {/* Audit Trail Notice */}
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "6px",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px dashed rgba(59, 130, 246, 0.3)",
              fontSize: "0.75rem",
              color: "#93c5fd",
              marginBottom: "1.5rem",
              lineHeight: 1.4,
            }}
          >
            <strong>Institutional Integrity Guarantee:</strong> Case delegation records an immutable entry in{" "}
            <code style={{ color: "#bfdbfe" }}>case_assignment_history</code> and emits a signed{" "}
            <code style={{ color: "#bfdbfe" }}>REASSIGNED</code> audit event visible to oversight auditors.
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "0.6rem 1rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #374151)",
                background: "transparent",
                color: "var(--text-secondary, #9ca3af)",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || reason.trim().length < 3 || (!isBureauChanged && !isOfficerChanged)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "6px",
                border: "none",
                background:
                  isSubmitting || reason.trim().length < 3 || (!isBureauChanged && !isOfficerChanged)
                    ? "#374151"
                    : "#2563eb",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor:
                  isSubmitting || reason.trim().length < 3 || (!isBureauChanged && !isOfficerChanged)
                    ? "not-allowed"
                    : "pointer",
                transition: "background 0.15s ease",
              }}
            >
              {isSubmitting ? (
                "Transferring..."
              ) : (
                <>
                  <Check size={16} />
                  Authorize Transfer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
