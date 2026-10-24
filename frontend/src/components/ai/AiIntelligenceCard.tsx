import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Check,
  RefreshCw,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { ComplaintCase, DuplicateCheckResponse, DuplicateMatch, TriageSuggestion, UserRole } from "../../types";
import { api } from "../../services/api";
import { DuplicateComparisonModal } from "./DuplicateComparisonModal";

interface AiIntelligenceCardProps {
  currentCase: ComplaintCase;
  userRole?: UserRole;
  onTriageApplied?: () => void;
}

export const AiIntelligenceCard: React.FC<AiIntelligenceCardProps> = ({
  currentCase,
  userRole,
  onTriageApplied,
}) => {
  const [duplicateData, setDuplicateData] = useState<DuplicateCheckResponse | null>(null);
  const [triageSuggestion, setTriageSuggestion] = useState<TriageSuggestion | null>(null);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateMatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(0.65);

  const [loading, setLoading] = useState<boolean>(true);
  const [applying, setApplying] = useState<boolean>(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setApplySuccess(null);
    setApplyError(null);

    Promise.allSettled([
      api.getCaseDuplicates(currentCase.case_reference_id, threshold),
      api.getCaseTriageSuggestion(currentCase.case_reference_id),
    ]).then(([dupResult, triageResult]) => {
      if (!isMounted) return;

      if (dupResult.status === "fulfilled" && dupResult.value.data) {
        setDuplicateData(dupResult.value.data);
      }
      if (triageResult.status === "fulfilled" && triageResult.value.data) {
        setTriageSuggestion(triageResult.value.data);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [currentCase.case_reference_id, threshold]);

  const handleApplySuggestion = async () => {
    if (!triageSuggestion) return;
    setApplying(true);
    setApplyError(null);
    setApplySuccess(null);

    try {
      const res = await api.applyTriageSuggestion({
        case_reference_id: currentCase.case_reference_id,
        bureau_id: triageSuggestion.recommended_bureau_id,
        category: triageSuggestion.recommended_category,
        priority: triageSuggestion.recommended_priority,
        justification: `Accepted explainable AI recommendation: Assigned to ${triageSuggestion.recommended_bureau_name} (${triageSuggestion.recommended_bureau_code}) with category '${triageSuggestion.recommended_category}'.`,
      });

      if (res.success && res.data) {
        setApplySuccess(`Successfully applied triage: Routed to ${res.data.bureau_name} (${triageSuggestion.recommended_bureau_code})`);
        if (onTriageApplied) {
          onTriageApplied();
        }
      } else {
        setApplyError(res.error?.message || "Failed to apply AI suggestion.");
      }
    } catch (err: any) {
      setApplyError(err.message || "Failed to communicate with AI intelligence service.");
    } finally {
      setApplying(false);
    }
  };

  const isAlreadyAligned =
    triageSuggestion &&
    currentCase.bureau?.code === triageSuggestion.recommended_bureau_code &&
    currentCase.category === triageSuggestion.recommended_category;

  const canApplyTriage =
    userRole === "SUPERVISOR" ||
    userRole === "ADMIN" ||
    userRole === "OFFICER";

  if (loading) {
    return (
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "14px",
          padding: "2rem",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <RefreshCw size={24} className="spin" style={{ color: "#8B5CF6" }} />
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
          Computing explainable AI heuristics & vector similarity matrix...
        </span>
      </div>
    );
  }

  const matches = duplicateData?.matches || [];
  const topDuplicate = matches[0] || null;
  const duplicateSimilarityPct = topDuplicate ? Math.round(topDuplicate.similarity_score * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* 1. Potential Duplicate Alert Banner */}
      {topDuplicate ? (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.08) 100%)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderLeft: "4px solid #F59E0B",
            borderRadius: "14px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1, minWidth: "260px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "0.1rem",
                }}
              >
                <ShieldAlert size={18} color="#F59E0B" />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                    {duplicateSimilarityPct >= 78 ? "High-Confidence Duplicate Collision" : "Thematically Related Case"}
                  </h4>
                  <span
                    style={{
                      background: duplicateSimilarityPct >= 78 ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                      border: `1px solid ${duplicateSimilarityPct >= 78 ? "#EF4444" : "#F59E0B"}`,
                      color: duplicateSimilarityPct >= 78 ? "#F87171" : "#FCD34D",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "6px",
                    }}
                  >
                    {duplicateSimilarityPct}% Semantic Match
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "0.15rem 0.45rem", borderRadius: "4px" }}>
                    Status: {topDuplicate.status}
                  </span>
                </div>

                <p style={{ fontSize: "0.82rem", color: "#CBD5E1", margin: "0.35rem 0 0 0", lineHeight: 1.4 }}>
                  Dense semantic similarity with registered case{" "}
                  <strong style={{ color: "#FFFFFF", fontFamily: "var(--font-mono)" }}>{topDuplicate.case_reference_id}</strong> at{" "}
                  <span style={{ color: "#93C5FD" }}>{topDuplicate.institution_name}</span>.
                </p>

                {topDuplicate.matched_keywords && topDuplicate.matched_keywords.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)" }}>Salient overlap:</span>
                    {topDuplicate.matched_keywords.map((kw, i) => (
                      <span
                        key={i}
                        style={{
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color: "#FCD34D",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          padding: "0.1rem 0.4rem",
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
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700 }}>Threshold:</span>
                {[0.60, 0.65, 0.75].map((val) => (
                  <button
                    key={val}
                    onClick={() => setThreshold(val)}
                    style={{
                      background: threshold === val ? "rgba(245, 158, 11, 0.25)" : "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${threshold === val ? "#F59E0B" : "rgba(255, 255, 255, 0.1)"}`,
                      color: threshold === val ? "#FCD34D" : "var(--text-secondary)",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {(val * 100).toFixed(0)}%
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setSelectedDuplicate(topDuplicate);
                  setIsModalOpen(true);
                }}
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  border: "none",
                  color: "#000000",
                  padding: "0.45rem 0.9rem",
                  borderRadius: "8px",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  boxShadow: "0 2px 10px rgba(245, 158, 11, 0.3)",
                }}
              >
                <span>Compare Side-by-Side</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "12px",
            padding: "0.85rem 1.1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.6rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <ShieldCheck size={18} color="#10B981" />
            <span style={{ fontSize: "0.82rem", color: "#6EE7B7", fontWeight: 600 }}>
              No Duplicate Collisions Detected &bull; Unique Grievance Narrative (Threshold: {(threshold * 100).toFixed(0)}%)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700 }}>Scan at:</span>
            {[0.60, 0.65, 0.75].map((val) => (
              <button
                key={val}
                onClick={() => setThreshold(val)}
                style={{
                  background: threshold === val ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.04)",
                  border: `1px solid ${threshold === val ? "#10B981" : "rgba(255, 255, 255, 0.1)"}`,
                  color: threshold === val ? "#6EE7B7" : "var(--text-secondary)",
                  padding: "0.15rem 0.4rem",
                  borderRadius: "4px",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {(val * 100).toFixed(0)}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Explainable Smart Triage Recommender */}
      {triageSuggestion && !dismissed && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderTop: "3px solid #8B5CF6",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.05) 100%)",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(139, 92, 246, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={16} color="#C4B5FD" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                    Explainable AI Routing Recommendation
                  </h3>
                  <span
                    style={{
                      background: "rgba(139, 92, 246, 0.2)",
                      border: "1px solid rgba(139, 92, 246, 0.4)",
                      color: "#C4B5FD",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "6px",
                    }}
                  >
                    {Math.round(triageSuggestion.confidence_score * 100)}% Confidence
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setDismissed(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>

          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Recommendation Targets Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
              <div
                style={{
                  background: "rgba(139, 92, 246, 0.08)",
                  border: "1px solid rgba(139, 92, 246, 0.25)",
                  borderRadius: "10px",
                  padding: "0.85rem",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#C4B5FD", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Recommended Target Bureau
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#FFFFFF", marginTop: "0.25rem" }}>
                  {triageSuggestion.recommended_bureau_name}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "0.15rem" }}>
                  Bureau Code: {triageSuggestion.recommended_bureau_code}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  borderRadius: "10px",
                  padding: "0.85rem",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#93C5FD", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Recommended Category
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#FFFFFF", marginTop: "0.25rem" }}>
                  {triageSuggestion.recommended_category}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                  Current: {currentCase.category || "Unassigned"}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "0.85rem",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Suggested SLA Priority
                </div>
                <div style={{ marginTop: "0.25rem" }}>
                  <span
                    style={{
                      background:
                        triageSuggestion.recommended_priority === "URGENT"
                          ? "rgba(239, 68, 68, 0.2)"
                          : triageSuggestion.recommended_priority === "HIGH"
                          ? "rgba(245, 158, 11, 0.2)"
                          : "rgba(59, 130, 246, 0.2)",
                      border: `1px solid ${
                        triageSuggestion.recommended_priority === "URGENT"
                          ? "#EF4444"
                          : triageSuggestion.recommended_priority === "HIGH"
                          ? "#F59E0B"
                          : "#3B82F6"
                      }`,
                      color:
                        triageSuggestion.recommended_priority === "URGENT"
                          ? "#F87171"
                          : triageSuggestion.recommended_priority === "HIGH"
                          ? "#FBBF24"
                          : "#93C5FD",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      padding: "0.2rem 0.6rem",
                      borderRadius: "6px",
                      display: "inline-block",
                    }}
                  >
                    {triageSuggestion.recommended_priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Explainable Rationale Breakdown */}
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Layers size={13} color="#8B5CF6" />
                <span>Explainability Evidence & Decision Factors</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {triageSuggestion.rationales.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        background: "rgba(139, 92, 246, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "0.1rem",
                      }}
                    >
                      <TrendingUp size={13} color="#A78BFA" />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#FFFFFF" }}>{item.title}</span>
                        <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          Weight: {Math.round(item.weight * 100)}%
                        </span>
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "#CBD5E1", margin: "0.2rem 0 0 0", lineHeight: 1.4 }}>
                        {item.explanation}
                      </p>

                      {item.matched_tokens && item.matched_tokens.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                          {item.matched_tokens.map((tok, ti) => (
                            <span
                              key={ti}
                              style={{
                                background: "rgba(139, 92, 246, 0.12)",
                                border: "1px solid rgba(139, 92, 246, 0.25)",
                                color: "#C4B5FD",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "0.1rem 0.35rem",
                                borderRadius: "4px",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {tok}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status alerts */}
            {applySuccess && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  color: "#6EE7B7",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <CheckCircle2 size={16} color="#10B981" />
                <span>{applySuccess}</span>
              </div>
            )}
            {applyError && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  color: "#FCA5A5",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <AlertTriangle size={16} color="#EF4444" />
                <span>{applyError}</span>
              </div>
            )}

            {/* Human-in-the-Loop Decision Buttons */}
            <div
              style={{
                paddingTop: "0.85rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Strict Human-in-the-Loop Gate &bull; Officer authorization mandatory before mutating dossier.
              </span>

              {isAlreadyAligned ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#10B981",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "8px",
                  }}
                >
                  <Check size={14} />
                  <span>Dossier Already Aligned with AI Suggestion</span>
                </div>
              ) : canApplyTriage ? (
                <button
                  onClick={handleApplySuggestion}
                  disabled={applying}
                  style={{
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    border: "none",
                    color: "#FFFFFF",
                    padding: "0.55rem 1.1rem",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {applying ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Applying Routing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Apply AI Triage (Human-in-the-Loop)</span>
                    </>
                  )}
                </button>
              ) : (
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Read-only view (Requires Case Officer or Supervisor role)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Comparison Modal */}
      <DuplicateComparisonModal
        currentCase={currentCase}
        duplicateMatch={selectedDuplicate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

