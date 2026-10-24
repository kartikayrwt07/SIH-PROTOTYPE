import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Award,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  MapPin,
  Scale,
  ChevronRight,
  X,
  Send,
  AlertOctagon,
  Search,
  Building2,
  ShieldAlert,
  Flame,
  FileText,
} from "lucide-react";
import {
  getTrustScores,
  getTrustSummary,
  getInstitutionTrustDetail,
  dispatchRegulatoryAction,
} from "@/api/index";
import type {
  InstitutionTrustScore,
  TrustLeaderboardSummary,
} from "@/types/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function InstitutionTrustLeaderboard() {
  const [institutions, setInstitutions] = useState<InstitutionTrustScore[]>([]);
  const [summary, setSummary] = useState<TrustLeaderboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRiskTier, setSelectedRiskTier] = useState("ALL");
  const [selectedState, setSelectedState] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"worst_first" | "best_first">("worst_first");

  // Modal Dossier state
  const [activeDossier, setActiveDossier] = useState<InstitutionTrustScore | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionCode, setActionCode] = useState("SHOW_CAUSE_SUMMONS");
  const [actionSummary, setActionSummary] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scores, sumData] = await Promise.all([
        getTrustScores({
          risk_tier: selectedRiskTier !== "ALL" ? selectedRiskTier : undefined,
          state: selectedState !== "ALL" ? selectedState : undefined,
        }),
        getTrustSummary(),
      ]);
      setInstitutions(scores);
      setSummary(sumData);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load institution trust score data");
    } finally {
      setLoading(false);
    }
  }, [selectedRiskTier, selectedState]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableStates = useMemo(() => {
    const set = new Set<string>();
    institutions.forEach((i) => {
      if (i.state) set.add(i.state);
    });
    return Array.from(set).sort();
  }, [institutions]);

  const filteredInstitutions = useMemo(() => {
    return institutions
      .filter((i) => {
        const matchesSearch =
          i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.aicte_permanent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.district.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        return sortOrder === "worst_first"
          ? a.trust_score - b.trust_score
          : b.trust_score - a.trust_score;
      });
  }, [institutions, searchTerm, sortOrder]);

  const handleOpenDossier = async (inst: InstitutionTrustScore) => {
    try {
      const detail = await getInstitutionTrustDetail(inst.institution_id);
      setActiveDossier(detail);
    } catch {
      setActiveDossier(inst);
    }
  };

  const handleOpenActionModal = (inst: InstitutionTrustScore) => {
    setActiveDossier(inst);
    setActionCode(inst.recommended_action_code || "SHOW_CAUSE_SUMMONS");
    setActionSummary(`Formal regulatory notice issued to Governing Board of ${inst.name} following repeated SLA deadline breaches and systemic student grievances.`);
    setActionModalOpen(true);
  };

  const handleDispatchAction = async () => {
    if (!activeDossier) return;
    setSubmittingAction(true);
    try {
      await dispatchRegulatoryAction(activeDossier.institution_id, {
        action_code: actionCode,
        summary: actionSummary,
      });
      toast.success(`Regulatory Action '${actionCode}' dispatched to ${activeDossier.name}!`);
      setActionModalOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e?.message || "Action dispatch failed");
    } finally {
      setSubmittingAction(false);
    }
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "AAA":
        return <Badge className="bg-emerald-600 text-white font-bold">AAA (Exemplary)</Badge>;
      case "AA":
        return <Badge className="bg-emerald-500 text-white font-bold">AA (Good Standing)</Badge>;
      case "A-":
        return <Badge className="bg-blue-600 text-white font-bold">A- (Moderate)</Badge>;
      case "BBB":
        return <Badge className="bg-amber-500 text-white font-bold">BBB (Watchlist)</Badge>;
      case "B":
        return <Badge className="bg-orange-600 text-white font-bold">B (High Risk)</Badge>;
      case "C":
      default:
        return <Badge className="bg-red-600 text-white font-bold">C (Critical Red Zone)</Badge>;
    }
  };

  return (
    <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Award className="h-6 w-6" />
            </span>
            <h1 className="font-serif text-2xl lg:text-3xl font-semibold text-ink tracking-tight">
              Institutional Trust Score &amp; Credit Ledger
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-3xl">
            Automated 1,000-Point Regulatory College Credit Scoring Engine. Tracks real-time statutory deductions
            for overdue SLA breaches, safety hazards, and systemic student clusters across all AICTE-approved institutions.
          </p>
        </div>

        <Button
          onClick={fetchData}
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 self-start md:self-auto border-rule"
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Recalculate Scores
        </Button>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
            <span>All-India Avg Score</span>
            <Award className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-ink font-mono">
            {summary?.national_average_score ? Math.round(summary.national_average_score) : 740}/1000
          </div>
          <div className="text-[10px] text-text-secondary">National compliance baseline</div>
        </div>

        <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
            <span>Critical Red Zone (&lt;400)</span>
            <AlertOctagon className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-semibold text-red-600 dark:text-red-400 font-mono">
            {summary?.critical_risk_count ?? 1}
          </div>
          <div className="text-[10px] text-red-600 font-medium">Mandatory Inspection Freeze</div>
        </div>

        <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
            <span>High Risk (400-549)</span>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400 font-mono">
            {summary?.high_risk_count ?? 2}
          </div>
          <div className="text-[10px] text-text-secondary">Show-Cause Summons</div>
        </div>

        <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
            <span>Watchlist (550-699)</span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 font-mono">
            {summary?.watchlist_count ?? 3}
          </div>
          <div className="text-[10px] text-text-secondary">Quarterly Ombudsman Audits</div>
        </div>

        <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
            <span>Compliant (700+)</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
            {summary?.compliant_count ?? 9}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Eligible for Auto-Approval</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-text-secondary" />
          <Input
            placeholder="Search college, district, AICTE ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs border-rule bg-white dark:bg-[#0B0813]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
            <SelectTrigger className="h-8 text-xs w-36 border-rule bg-white dark:bg-[#0B0813]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="worst_first">Worst Score First</SelectItem>
              <SelectItem value="best_first">Best Score First</SelectItem>
            </SelectContent>
          </Select>

          {availableStates.length > 0 && (
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="h-8 text-xs w-36 border-rule bg-white dark:bg-[#0B0813]">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All States</SelectItem>
                {availableStates.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Institutions Cards List */}
      <div className="space-y-4">
        {filteredInstitutions.length === 0 ? (
          <div className="text-center py-16 bg-white/50 dark:bg-[#07050E]/50 border border-dashed border-rule rounded-xl space-y-2">
            <Building2 className="h-8 w-8 text-text-secondary mx-auto" />
            <h3 className="font-serif text-base font-semibold text-ink">
              No matching institutions found
            </h3>
            <p className="text-xs text-text-secondary">Try adjusting your search criteria or state filter.</p>
          </div>
        ) : (
          filteredInstitutions.map((inst) => {
            const isCritical = inst.trust_score < 400;
            const isHighRisk = inst.trust_score >= 400 && inst.trust_score < 550;

            return (
              <div
                key={inst.institution_id}
                className="bg-white/85 dark:bg-[#0B0813]/85 backdrop-blur-md border border-rule hover:border-purple-300 dark:hover:border-purple-800 transition-all p-5 rounded-xl shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getGradeBadge(inst.trust_grade)}
                      <span className="font-mono text-xs text-text-secondary">
                        {inst.aicte_permanent_id}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        {inst.institution_type}
                      </span>
                    </div>

                    <h3 className="font-serif text-base font-semibold text-ink">
                      {inst.name}
                    </h3>

                    <div className="text-xs text-text-secondary flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                      <span>{inst.district}, {inst.state}</span>
                      <span>•</span>
                      <span>{inst.total_cases} Grievances Docketed</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">
                        {Math.round(inst.resolution_rate_pct)}% Resolution Rate
                      </span>
                    </div>
                  </div>

                  {/* Trust Score Display */}
                  <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span
                          className={`font-mono text-2xl font-bold ${
                            isCritical
                              ? "text-red-600 dark:text-red-400"
                              : isHighRisk
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {inst.trust_score}
                        </span>
                        <span className="text-xs text-text-secondary font-mono">/ 1000</span>
                        {inst.trend === "deteriorating" ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="text-[10px] text-text-secondary font-medium">
                        {inst.risk_tier}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Button
                        onClick={() => handleOpenDossier(inst)}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 border-rule"
                      >
                        Penalty Ledger
                      </Button>
                      <Button
                        onClick={() => handleOpenActionModal(inst)}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-2.5 font-medium shadow-xs"
                      >
                        Sanctions
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Directive Banner */}
                <div className="pt-2 border-t border-rule/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="text-text-secondary">
                      Directive: <strong className="text-ink">{inst.automated_directive}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                    <span>Overdue Breaches: <strong className="text-red-600 font-mono">{inst.overdue_cases}</strong></span>
                    <span>•</span>
                    <span>Pending: <strong className="text-ink font-mono">{inst.open_cases}</strong></span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Penalty Ledger Dossier Modal */}
      <Dialog open={!!activeDossier && !actionModalOpen} onOpenChange={(open) => !open && setActiveDossier(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {activeDossier && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {getGradeBadge(activeDossier.trust_grade)}
                  <span className="font-mono text-xs text-text-secondary">{activeDossier.aicte_permanent_id}</span>
                </div>
                <DialogTitle className="font-serif text-lg font-semibold text-ink">
                  {activeDossier.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-text-secondary">
                  Mathematical Penalty Ledger &amp; Regulatory Audit Citations
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Score breakdown card */}
                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[11px] text-text-secondary">Base Score</div>
                    <div className="font-mono text-lg font-semibold text-ink">1000 pts</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-text-secondary">Total Deductions</div>
                    <div className="font-mono text-lg font-semibold text-red-600">
                      -{activeDossier.deduction_breakdown?.total_deductions ?? 0} pts
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-text-secondary">Net Trust Score</div>
                    <div className="font-mono text-lg font-bold text-purple-600 dark:text-purple-400">
                      {activeDossier.trust_score} / 1000
                    </div>
                  </div>
                </div>

                {/* Itemized deduction table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
                    Statutory Penalty Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg border border-rule bg-surface flex justify-between">
                      <span className="text-text-secondary">Overdue SLA Breaches ({activeDossier.deduction_breakdown?.sla_breaches_count ?? 0})</span>
                      <span className="font-mono text-red-600 font-semibold">-{activeDossier.deduction_breakdown?.sla_breach_points ?? 0} pts</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-rule bg-surface flex justify-between">
                      <span className="text-text-secondary">Safety &amp; Urgent Cases ({activeDossier.deduction_breakdown?.severe_complaints_count ?? 0})</span>
                      <span className="font-mono text-red-600 font-semibold">-{activeDossier.deduction_breakdown?.severe_complaint_points ?? 0} pts</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-rule bg-surface flex justify-between">
                      <span className="text-text-secondary">Systemic Clusters ({activeDossier.deduction_breakdown?.master_ticket_clusters_count ?? 0})</span>
                      <span className="font-mono text-red-600 font-semibold">-{activeDossier.deduction_breakdown?.master_ticket_points ?? 0} pts</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-rule bg-surface flex justify-between">
                      <span className="text-text-secondary">Backlog &gt;30 Days ({activeDossier.deduction_breakdown?.backlog_dwell_count ?? 0})</span>
                      <span className="font-mono text-red-600 font-semibold">-{activeDossier.deduction_breakdown?.backlog_dwell_points ?? 0} pts</span>
                    </div>
                  </div>
                </div>

                {/* Deduction Citations */}
                {activeDossier.citations && activeDossier.citations.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
                      Specific Incident Citations
                    </h4>
                    <div className="space-y-2">
                      {activeDossier.citations.map((cite, cIdx) => (
                        <div key={cIdx} className="p-3 rounded-lg border border-rule text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold text-purple-600">{cite.case_reference_id}</span>
                            <span className="font-mono text-red-600 font-semibold">-{cite.points_deducted} pts</span>
                          </div>
                          <div className="text-ink font-medium">{cite.subject}</div>
                          <div className="text-[11px] text-text-secondary">{cite.deduction_reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button size="sm" onClick={() => setActiveDossier(null)} className="text-xs h-8">
                  Close Ledger
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispatch Regulatory Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-semibold flex items-center gap-2 text-ink">
              <Scale className="h-5 w-5 text-purple-600" />
              Dispatch Regulatory Sanction
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Formal statutory directive dispatched to Governing Board of{" "}
              <strong>{activeDossier?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink">Regulatory Action Code</label>
              <Select value={actionCode} onValueChange={setActionCode}>
                <SelectTrigger className="h-9 text-xs border-rule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHOW_CAUSE_SUMMONS">SHOW_CAUSE_SUMMONS (Notice to Governing Board)</SelectItem>
                  <SelectItem value="MANDATORY_INSPECTION_FREEZE">MANDATORY_INSPECTION_FREEZE (Academic Freeze)</SelectItem>
                  <SelectItem value="HEIGHTENED_MONITORING">HEIGHTENED_MONITORING (Quarterly Reports)</SelectItem>
                  <SelectItem value="ROUTINE_COMPLIANCE">ROUTINE_COMPLIANCE (Standard Verification)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-ink">Directive Summary &amp; Compliance Terms</label>
              <Input
                value={actionSummary}
                onChange={(e) => setActionSummary(e.target.value)}
                className="text-xs border-rule"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionModalOpen(false)}
              className="text-xs h-8 border-rule"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDispatchAction}
              disabled={submittingAction || !actionSummary.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 gap-1.5"
            >
              {submittingAction ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Dispatch Sanction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
