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
      api.getCaseDuplicates(currentCase.case_reference_id, 0.35),
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
  }, [currentCase.case_reference_id]);

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
        setApplySuccess(`Successfully applied triage: Routed to ${res.data.bureau_name}`);
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

  // Authorization check: Officer, Supervisor, or Admin can act on triage
  const canApplyTriage =
    userRole === "SUPERVISOR" ||
    userRole === "ADMIN" ||
    userRole === "OFFICER";

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center space-x-3 text-slate-500 animate-pulse">
          <Sparkles className="w-5 h-5 text-indigo-500 animate-spin" />
          <span className="text-xs font-medium">Computing explainable AI heuristics & vector similarity...</span>
        </div>
      </div>
    );
  }

  const topDuplicate = duplicateData?.matches?.[0] || null;
  const duplicateSimilarityPct = topDuplicate ? Math.round(topDuplicate.similarity_score * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 1. Potential Duplicate Alert Banner */}
      {topDuplicate && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-amber-900">
                    Potential Duplicate Detected ({duplicateSimilarityPct}% Similarity)
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 rounded-full">
                    {topDuplicate.status}
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  High lexical similarity with registered case{" "}
                  <span className="font-mono font-semibold">{topDuplicate.case_reference_id}</span> at{" "}
                  <span className="font-semibold">{topDuplicate.institution_name}</span>.
                </p>

                {topDuplicate.matched_keywords && topDuplicate.matched_keywords.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[11px] font-medium text-amber-700">Salient overlap:</span>
                    {topDuplicate.matched_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 text-[10px] bg-white/80 text-amber-800 border border-amber-300 rounded font-mono"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedDuplicate(topDuplicate);
                setIsModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors shrink-0 flex items-center gap-1"
            >
              <span>Compare</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Explainable Smart Triage Recommender */}
      {triageSuggestion && !dismissed && (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  Explainable Smart Routing Suggestion
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                    {Math.round(triageSuggestion.confidence_score * 100)}% Confidence
                  </span>
                </h3>
              </div>
            </div>

            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Dismiss
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Recommendation Targets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Target Bureau
                </span>
                <span className="text-xs font-bold text-indigo-900 block">
                  {triageSuggestion.recommended_bureau_name}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Code: {triageSuggestion.recommended_bureau_code}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Recommended Category
                </span>
                <span className="text-xs font-semibold text-slate-800 block">
                  {triageSuggestion.recommended_category}
                </span>
                <span className="text-[11px] text-slate-500">
                  Current: {currentCase.category || "Unassigned"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Suggested Priority
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded inline-block ${
                    triageSuggestion.recommended_priority === "URGENT"
                      ? "bg-red-100 text-red-700"
                      : triageSuggestion.recommended_priority === "HIGH"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {triageSuggestion.recommended_priority}
                </span>
              </div>
            </div>

            {/* Explainable Rationale Breakdown */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Explainability Factors & Evidence
              </label>

              <div className="space-y-2">
                {triageSuggestion.rationales.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors flex items-start gap-3"
                  >
                    <div className="p-1 bg-slate-100 rounded text-slate-600 mt-0.5 shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">{item.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Weight: {Math.round(item.weight * 100)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{item.explanation}</p>

                      {item.matched_tokens && item.matched_tokens.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {item.matched_tokens.map((tok, ti) => (
                            <span
                              key={ti}
                              className="px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 rounded font-mono"
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
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{applySuccess}</span>
              </div>
            )}
            {applyError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{applyError}</span>
              </div>
            )}

            {/* Human-in-the-Loop Decision Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Decision Gate: Officer authorization mandatory before updating dossier.
              </span>

              {isAlreadyAligned ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                  <span>Dossier Aligned with AI Suggestion</span>
                </div>
              ) : canApplyTriage ? (
                <button
                  onClick={handleApplySuggestion}
                  disabled={applying}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {applying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Applying Routing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply Suggestion (Human-in-the-Loop)</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Read-only view (Requires Case Officer or Supervisor role to apply)
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
