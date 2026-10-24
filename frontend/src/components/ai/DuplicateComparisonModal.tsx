import React from "react";
import { X, ShieldAlert, Building2 } from "lucide-react";
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

  const getSimilarityBadge = (pct: number) => {
    if (pct >= 78) {
      return {
        bg: "bg-red-50 text-red-700 border-red-200",
        bar: "bg-red-600",
        label: "Critical Match (High Confidence Duplicate)",
      };
    }
    if (pct >= 65) {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        bar: "bg-amber-500",
        label: "Moderate Match (Thematically Related Cluster)",
      };
    }
    return {
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      bar: "bg-blue-500",
      label: "Low Match (Marginal Affinity)",
    };
  };

  const badgeStyle = getSimilarityBadge(similarityPct);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Duplicate Complaint Dossier Comparison
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badgeStyle.bg}`}>
                  {similarityPct}% Match
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                AICTE Dense Semantic Vector Embedding Analysis (BGE-Small ONNX)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Similarity Metric Gauge Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex-1 max-w-md">
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Cosine Similarity Confidence: {similarityPct}%</span>
              <span className="text-slate-500">{badgeStyle.label}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${badgeStyle.bar}`}
                style={{ width: `${Math.min(similarityPct, 100)}%` }}
              />
            </div>
          </div>

          {duplicateMatch.matched_keywords && duplicateMatch.matched_keywords.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-slate-500">Matched Tokens:</span>
              {duplicateMatch.matched_keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-800 rounded-md border border-amber-200"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Side-by-side comparison panels */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
          {/* Current Case (Left) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded">
                  Current Case (Focus)
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {currentCase.case_reference_id}
                </span>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {currentCase.status}
              </span>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Subject
                </label>
                <p className="text-sm font-semibold text-slate-800">{currentCase.subject}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Institution
                </label>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{currentCase.institution?.name || "Central / Unaffiliated"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Bureau
                  </label>
                  <span className="font-medium text-slate-700">
                    {currentCase.bureau?.name || currentCase.bureau?.code || "Pending Assignment"}
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Category
                  </label>
                  <span className="font-medium text-slate-700">{currentCase.category}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Grievance Narrative
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {currentCase.description_confidential || currentCase.description_redacted || "No narrative text."}
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Duplicate (Right) */}
          <div className="bg-white p-5 rounded-xl border-2 border-amber-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100 mb-4">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded">
                  Matched Candidate
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {duplicateMatch.case_reference_id}
                </span>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {duplicateMatch.status}
              </span>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Subject
                </label>
                <p className="text-sm font-semibold text-slate-800">{duplicateMatch.subject}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Institution
                </label>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {duplicateMatch.institution_name} ({duplicateMatch.institution_aicte_id})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Bureau
                  </label>
                  <span className="font-medium text-slate-700">
                    {duplicateMatch.bureau_name} ({duplicateMatch.bureau_code})
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Registered On
                  </label>
                  <span className="font-medium text-slate-700">
                    {new Date(duplicateMatch.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Matching Overlap Rationale
                </label>
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-slate-700 space-y-2">
                  <p className="font-medium text-amber-900">
                    High n-gram overlap detected across academic institution and grievance narrative.
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Officers may link this complaint as a duplicate submission or reference the earlier case investigation dossier for precedent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Human-in-the-Loop decision required. No automatic merge or deletion performed.
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
