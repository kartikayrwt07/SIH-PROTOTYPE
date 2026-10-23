import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ChevronRight,
  RefreshCw,
  Search,
} from "lucide-react";
import { ComplaintCase } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { AiIntelligenceCard } from "./AiIntelligenceCard";

interface SmartTriageViewProps {
  onSelectCaseDetail?: (caseRef: string) => void;
}

export const SmartTriageView: React.FC<SmartTriageViewProps> = ({ onSelectCaseDetail }) => {
  const { currentRole } = useAuth();
  const [cases, setCases] = useState<ComplaintCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCase, setSelectedCase] = useState<ComplaintCase | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadTriageCases = async () => {
    setLoading(true);
    try {
      // Fetch cases with pending triage statuses: Received, Registered, Under Triage
      const res = await api.getCases({
        page: 1,
        page_size: 50,
      });

      if (res.success && res.data) {
        setCases(res.data);
        if (res.data.length > 0 && !selectedCase) {
          setSelectedCase(res.data[0]);
        }
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTriageCases();
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_reference_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.institution?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "pending") {
      return (
        matchesSearch &&
        (c.status === "Received" || c.status === "Registered" || c.status === "Under Triage")
      );
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            AICTE Grievance Intelligence Layer
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Smart Triage & Duplicate Sentinel
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Deterministic TF-IDF duplicate detection and explainable heuristics to route incoming complaints to target bureaus.
          </p>
        </div>

        <button
          onClick={loadTriageCases}
          className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pending complaints by keyword, institution, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Cases ({cases.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === "pending"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Pending Triage (
            {
              cases.filter(
                (c) => c.status === "Received" || c.status === "Registered" || c.status === "Under Triage"
              ).length
            }
            )
          </button>
        </div>
      </div>

      {/* Split Triage Console: Left Queue + Right AI Intelligence Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue Column (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[780px]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Complaint Intake Queue ({filteredCases.length})
            </span>
            <span className="text-[11px] text-slate-400">Click to evaluate</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredCases.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No matching complaints found in queue.
              </div>
            ) : (
              filteredCases.map((c) => {
                const isSelected = selectedCase?.case_reference_id === c.case_reference_id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-50/60 border-l-4 border-indigo-600"
                        : "hover:bg-slate-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {c.case_reference_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          c.status === "Received" || c.status === "Registered"
                            ? "bg-amber-100 text-amber-800"
                            : c.status === "Assigned" || c.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 mb-1">
                      {c.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate max-w-[200px]">
                        {c.institution?.name || "Unaffiliated Institution"}
                      </span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: AI Intelligence & Inspection Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCase ? (
            <div className="space-y-4">
              {/* Selected Case Quick Summary Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-600 block">
                      {selectedCase.case_reference_id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedCase.subject}
                    </h3>
                  </div>

                  {onSelectCaseDetail && (
                    <button
                      onClick={() => onSelectCaseDetail(selectedCase.case_reference_id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0 flex items-center gap-1"
                    >
                      <span>Full Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-xs mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Current Bureau
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedCase.bureau?.name || selectedCase.bureau?.code || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Category
                    </span>
                    <span className="font-semibold text-slate-800">{selectedCase.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Priority
                    </span>
                    <span className="font-semibold text-slate-800">{selectedCase.priority}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Grievance Abstract
                  </span>
                  <p className="text-xs text-slate-700 bg-slate-50/70 p-3 rounded-lg border border-slate-200/60 leading-relaxed max-h-36 overflow-y-auto">
                    {selectedCase.description_confidential || selectedCase.description_redacted}
                  </p>
                </div>
              </div>

              {/* Explainable AI Intelligence & Duplicate Detection Card */}
              <AiIntelligenceCard
                currentCase={selectedCase}
                userRole={currentRole}
                onTriageApplied={() => {
                  loadTriageCases();
                  api.getCaseDetail(selectedCase.case_reference_id).then((res) => {
                    if (res.success && res.data) {
                      setSelectedCase(res.data);
                    }
                  });
                }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">Select a complaint case from the intake queue to evaluate AI routing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
