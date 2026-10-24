import React from "react";
import { X, ShieldAlert, Building2, AlertTriangle } from "lucide-react";
import { ComplaintCase, DuplicateMatch } from "../../types";

interface DuplicateComparisonModalProps {
  currentCase: ComplaintCase;
  duplicateMatch: DuplicateMatch | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectDuplicate?: (match: DuplicateMatch) => void;
}

export const DuplicateComparisonModal: React.FC<DuplicateComparisonModalProps> = ({
  currentCase,
  duplicateMatch,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !duplicateMatch) return null;

  const similarityPct = Math.round(duplicateMatch.similarity_score * 100);

  const getMatchTheme = (pct: number) => {
    if (pct >= 78) {
      return {
        color: "#EF4444",
        bg: "rgba(239, 68, 68, 0.15)",
        border: "rgba(239, 68, 68, 0.4)",
        label: "Critical Duplicate Collision (High Confidence)",
        gradient: "linear-gradient(90deg, #EF4444, #F97316)",
      };
    }
    if (pct >= 65) {
      return {
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.15)",
        border: "rgba(245, 158, 11, 0.4)",
        label: "Thematically Related Cluster (Moderate Similarity)",
        gradient: "linear-gradient(90deg, #F59E0B, #EAB308)",
      };
    }
    return {
      color: "#3B82F6",
      bg: "rgba(59, 130, 246, 0.15)",
      border: "rgba(59, 130, 246, 0.4)",
      label: "Thematic Overlap (Low Match)",
      gradient: "linear-gradient(90deg, #3B82F6, #06B6D4)",
    };
  };

  const theme = getMatchTheme(similarityPct);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1050px",
          background: "var(--bg-surface)",
          border: `1px solid ${theme.border}`,
          borderRadius: "16px",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            background: "rgba(255, 255, 255, 0.03)",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldAlert size={20} color={theme.color} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                  Semantic Duplicate Dossier Comparison
                </h3>
                <span
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    color: theme.color,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "6px",
                  }}
                >
                  {similarityPct}% Semantic Match
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.2rem 0 0 0" }}>
                AICTE Dense Vector Embedding Cosine Analysis &bull; Deterministic Token Overlap Verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              padding: "0.4rem",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Similarity Metric Gauge Bar */}
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "rgba(0, 0, 0, 0.25)",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ flex: 1, minWidth: "280px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.35rem" }}>
              <span style={{ color: "#FFFFFF" }}>Cosine Similarity Score: {similarityPct}%</span>
              <span style={{ color: theme.color }}>{theme.label}</span>
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(similarityPct, 100)}%`,
                  height: "100%",
                  background: theme.gradient,
                  borderRadius: "4px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          {duplicateMatch.matched_keywords && duplicateMatch.matched_keywords.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
                Salient Overlap Tokens:
              </span>
              {duplicateMatch.matched_keywords.map((kw, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    color: "#FCD34D",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Side-by-side comparison panels */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {/* Current Case (Left) */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-subtle)",
              borderTop: "3px solid #8B5CF6",
              borderRadius: "12px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ background: "rgba(139, 92, 246, 0.18)", color: "#C4B5FD", fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                  CURRENT FOCUS CASE
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 800, color: "#FFFFFF" }}>
                  {currentCase.case_reference_id}
                </span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(255, 255, 255, 0.05)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                {currentCase.status}
              </span>
            </div>

            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                Subject
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.35 }}>
                {currentCase.subject}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                Collegiate Institution
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "#E2E8F0" }}>
                <Building2 size={14} color="#94A3B8" />
                <span>{currentCase.institution?.name || "Central / Unaffiliated"}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "0.6rem", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Bureau</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#93C5FD", marginTop: "0.15rem" }}>
                  {currentCase.bureau?.name || currentCase.bureau?.code || "Unassigned"}
                </div>
              </div>
              <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "0.6rem", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Category</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FCD34D", marginTop: "0.15rem" }}>
                  {currentCase.category}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.35rem" }}>
                Grievance Abstract
              </div>
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.35)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "0.85rem",
                  fontSize: "0.82rem",
                  color: "#CBD5E1",
                  maxHeight: "180px",
                  overflowY: "auto",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {currentCase.description_confidential || currentCase.description_redacted || "No narrative text."}
              </div>
            </div>
          </div>

          {/* Candidate Duplicate (Right) */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: `1px solid ${theme.border}`,
              borderTop: `3px solid ${theme.color}`,
              borderRadius: "12px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ background: theme.bg, color: theme.color, fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                  MATCHED CANDIDATE
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 800, color: "#FFFFFF" }}>
                  {duplicateMatch.case_reference_id}
                </span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(255, 255, 255, 0.05)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                {duplicateMatch.status}
              </span>
            </div>

            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                Subject
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.35 }}>
                {duplicateMatch.subject}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                Collegiate Institution
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "#E2E8F0" }}>
                <Building2 size={14} color="#94A3B8" />
                <span>
                  {duplicateMatch.institution_name} {duplicateMatch.institution_aicte_id && `(${duplicateMatch.institution_aicte_id})`}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "0.6rem", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Bureau</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#93C5FD", marginTop: "0.15rem" }}>
                  {duplicateMatch.bureau_name} ({duplicateMatch.bureau_code})
                </div>
              </div>
              <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "0.6rem", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Filed On</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#E2E8F0", marginTop: "0.15rem" }}>
                  {new Date(duplicateMatch.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.35rem" }}>
                Collision Rationale & Analysis
              </div>
              <div
                style={{
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "8px",
                  padding: "0.85rem",
                  fontSize: "0.82rem",
                  color: "#E2E8F0",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: theme.color, fontWeight: 700, marginBottom: "0.3rem" }}>
                  <AlertTriangle size={14} />
                  <span>Substantial Vector & Semantic Overlap</span>
                </div>
                <div>
                  High cosine affinity across academic institution and narrative themes. Case officers may review the precedent ATR of this registered dossier or combine under a Master Ticket.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "rgba(255, 255, 255, 0.03)",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Human-in-the-Loop decision required. No automated case destruction or mutation is executed.
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid var(--border-subtle)",
              color: "#FFFFFF",
              padding: "0.5rem 1.1rem",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};

