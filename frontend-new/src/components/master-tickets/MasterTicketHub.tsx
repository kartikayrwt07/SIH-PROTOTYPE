import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Layers,
  Search,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  X,
  Check,
  RefreshCw,
  Sparkles,
  Timer,
  ExternalLink,
  ShieldCheck,
  Building2,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  FileText,
  Flame,
  SlidersHorizontal,
} from "lucide-react";
import {
  autoDetectMasterTickets,
  createMasterTicket,
  listMasterTickets,
  getMasterTicket,
  resolveMasterTicket,
  getMasterTicketStats,
  getMasterTicketInstitutionBreakdown,
} from "@/api/index";
import type {
  MasterTicket,
  DetectedGroup,
  MasterTicketStats,
} from "@/types/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

type SubTab = "clusters" | "tickets" | "institutions";

export function MasterTicketHub() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("clusters");
  const [stats, setStats] = useState<MasterTicketStats | null>(null);
  const [tickets, setTickets] = useState<MasterTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [detectedGroups, setDetectedGroups] = useState<DetectedGroup[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<MasterTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [resolveRemarks, setResolveRemarks] = useState("");
  const [threshold, setThreshold] = useState(0.70);
  const [minGroupSize, setMinGroupSize] = useState(2);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);

  // Institution hotspot breakdown state
  const [institutionBreakdowns, setInstitutionBreakdowns] = useState<any[]>([]);
  const [breakdownSearch, setBreakdownSearch] = useState("");
  const [expandedColleges, setExpandedColleges] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, ticketsData] = await Promise.all([
        getMasterTicketStats(),
        listMasterTickets(statusFilter || undefined),
      ]);
      setStats(statsData);
      setTickets(ticketsData);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load master ticket data");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchBreakdowns = useCallback(async () => {
    try {
      const data = await getMasterTicketInstitutionBreakdown();
      setInstitutionBreakdowns(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchBreakdowns();
  }, [fetchData, fetchBreakdowns]);

  const handleRunDetect = async () => {
    setDetecting(true);
    try {
      const res = await autoDetectMasterTickets({
        similarity_threshold: threshold,
        min_group_size: minGroupSize,
      });
      setDetectedGroups(res.groups);
      toast.success(`Discovered ${res.groups.length} systemic grievance clusters across ${res.total_cases_evaluated} cases.`);
    } catch (e: any) {
      toast.error(e?.message || "Cluster detection scan failed");
    } finally {
      setDetecting(false);
    }
  };

  const handleCreateTicket = async (group: DetectedGroup) => {
    setCreating(group.anchor_case_reference_id);
    try {
      const newTicket = await createMasterTicket({
        institution_aicte_id: group.institution_aicte_id,
        category: group.category,
        child_case_references: group.member_case_refs,
        consolidated_subject: `Systemic Cluster: ${group.category} at ${group.institution_name}`,
      });
      toast.success(`Created Master Ticket ${newTicket.ticket_reference_id} linking ${group.member_count} complaints!`);
      // Remove from detected list
      setDetectedGroups((prev) => prev.filter((g) => g.anchor_case_reference_id !== group.anchor_case_reference_id));
      fetchData();
      setActiveSubTab("tickets");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate master ticket");
    } finally {
      setCreating(null);
    }
  };

  const handleOpenResolveModal = (ticket: MasterTicket) => {
    setSelectedTicket(ticket);
    setResolveRemarks(`Consolidated regulatory compliance order issued under Section 10 AICTE Act for ${ticket.ticket_reference_id}. All grievances redressed.`);
    setResolveModalOpen(true);
  };

  const handleConfirmResolve = async () => {
    if (!selectedTicket) return;
    setResolving(true);
    try {
      await resolveMasterTicket(selectedTicket.ticket_reference_id, resolveRemarks);
      toast.success(`Master Ticket ${selectedTicket.ticket_reference_id} and all child cases resolved simultaneously!`);
      setResolveModalOpen(false);
      setSelectedTicket(null);
      fetchData();
    } catch (e: any) {
      toast.error(e?.message || "Resolution cascade failed");
    } finally {
      setResolving(false);
    }
  };

  const filteredBreakdowns = useMemo(() => {
    return institutionBreakdowns.filter((b) => {
      const name = b.institution_name || b.name || "";
      return name.toLowerCase().includes(breakdownSearch.toLowerCase());
    });
  }, [institutionBreakdowns, breakdownSearch]);

  return (
    <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Title & Mission */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Layers className="h-6 w-6" />
            </span>
            <h1 className="font-serif text-2xl lg:text-3xl font-semibold text-ink tracking-tight">
              Master Ticket Command Hub
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-3xl">
            Dense Semantic Vector Clustering & Automated Master Ticket Consolidation.
            Detect repetitive institutional complaints across Indian colleges and resolve 
            hundreds of child tickets with 1-click regulatory compliance orders.
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
          Refresh Registry
        </Button>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
            <span>Total Clusters</span>
            <Layers className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-semibold text-ink font-mono">
            {stats?.total_master_tickets ?? 0}
          </div>
          <div className="text-[10px] text-text-secondary">Consolidated parent dossiers</div>
        </div>

        <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
            <span>Active Hotspots</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 font-mono">
            {stats?.active_clusters ?? 0}
          </div>
          <div className="text-[10px] text-text-secondary">Pending resolution</div>
        </div>

        <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
            <span>Resolved Clusters</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
            {stats?.resolved_clusters ?? 0}
          </div>
          <div className="text-[10px] text-text-secondary">Cascaded to all children</div>
        </div>

        <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
            <span>Linked Complaints</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400 font-mono">
            {stats?.total_cases_grouped ?? 0}
          </div>
          <div className="text-[10px] text-text-secondary">Bound child tickets</div>
        </div>

        <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
            <span>Time Saved</span>
            <Zap className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-semibold text-purple-600 dark:text-purple-400 font-mono">
            ~{Math.round(stats?.estimated_hours_saved ?? 0)}h
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">85% Review Efficiency Gain</div>
        </div>
      </div>

      {/* Main SubTab Navigation */}
      <div className="border-b border-rule flex items-center gap-8">
        <button
          onClick={() => setActiveSubTab("clusters")}
          className={`pb-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "clusters"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 font-semibold"
              : "border-transparent text-text-secondary hover:text-ink"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Semantic Cluster Detection</span>
          {detectedGroups.length > 0 && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-[10px] px-1.5 py-0 h-4">
              {detectedGroups.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("tickets")}
          className={`pb-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "tickets"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 font-semibold"
              : "border-transparent text-text-secondary hover:text-ink"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Active Master Tickets</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {tickets.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveSubTab("institutions")}
          className={`pb-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "institutions"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 font-semibold"
              : "border-transparent text-text-secondary hover:text-ink"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Institutional Repeat Hotspots</span>
        </button>
      </div>

      {/* Tab 1: Semantic Cluster Detection */}
      {activeSubTab === "clusters" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white/80 dark:bg-[#0B0813]/80 backdrop-blur-md border border-rule p-5 rounded-xl shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-purple-500" />
                  Vector Cluster Parameters
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Calibrated cosine similarity thresholds and group size constraints for candidate cluster aggregation.
                </p>
              </div>

              <Button
                onClick={handleRunDetect}
                disabled={detecting}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 px-4 gap-2 font-medium shadow-xs"
              >
                {detecting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Scanning Dense Vectors...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Run AI Cluster Detection
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-rule/60">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">Similarity Sensitivity</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                    {Math.round(threshold * 100)}% (Cosine &gt;= {threshold.toFixed(2)})
                  </span>
                </div>
                <Slider
                  value={[threshold * 100]}
                  min={50}
                  max={90}
                  step={5}
                  onValueChange={(val) => setThreshold((val[0] ?? 70) / 100)}
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>60% (Broad Clustering)</span>
                  <span>70% (Balanced)</span>
                  <span>78%+ (Strict Duplicate)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">Minimum Cluster Size</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                    {minGroupSize} Complaints
                  </span>
                </div>
                <Slider
                  value={[minGroupSize]}
                  min={2}
                  max={6}
                  step={1}
                  onValueChange={(val) => setMinGroupSize(val[0] ?? 2)}
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>Min 2 Cases</span>
                  <span>Min 4 Cases</span>
                  <span>Min 6+ (Systemic Crisis)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detected Groups Display */}
          {detectedGroups.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white/50 dark:bg-[#07050E]/50 border border-dashed border-rule rounded-xl space-y-3">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-base font-semibold text-ink">
                No active scan results
              </h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Click &quot;Run AI Cluster Detection&quot; above to scan recent complaints using Fastembed vector
                similarity and detect systemic grievances affecting multiple students.
              </p>
              <Button
                onClick={handleRunDetect}
                disabled={detecting}
                size="sm"
                className="bg-purple-600 text-white text-xs h-8"
              >
                Scan Now
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-text-secondary px-1">
                <span>Detected {detectedGroups.length} systemic candidate clusters:</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {detectedGroups.map((group, idx) => (
                  <div
                    key={idx}
                    className="bg-white/85 dark:bg-[#0B0813]/85 backdrop-blur-md border border-rule hover:border-purple-300 dark:hover:border-purple-800 transition-all p-5 rounded-xl shadow-xs space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-950/40 text-[10px] font-mono">
                            {group.bureau_code}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {group.category}
                          </Badge>
                          <span className="text-[11px] font-mono text-text-secondary">
                            Anchor: {group.anchor_case_reference_id}
                          </span>
                        </div>
                        <h4 className="font-serif text-base font-semibold text-ink">
                          {group.anchor_subject}
                        </h4>
                        <div className="text-xs text-text-secondary flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{group.institution_name}</span>
                          <span className="font-mono text-[10px]">({group.institution_aicte_id})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 font-mono">
                            {group.member_count} Cases
                          </div>
                          <div className="text-[10px] text-text-secondary">
                            {Math.round(group.avg_similarity * 100)}% Match
                          </div>
                        </div>

                        <Button
                          onClick={() => handleCreateTicket(group)}
                          disabled={creating === group.anchor_case_reference_id}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-3 gap-1.5 font-medium shadow-xs"
                        >
                          {creating === group.anchor_case_reference_id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Layers className="h-3.5 w-3.5" />
                          )}
                          Consolidate Master Ticket
                        </Button>
                      </div>
                    </div>

                    {/* Member references pill list */}
                    <div className="pt-2 border-t border-rule/60 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-text-secondary font-medium mr-1">Linked Cases:</span>
                      {group.member_case_refs.map((ref) => (
                        <Link
                          key={ref}
                          to="/cases/$id"
                          params={{ id: ref }}
                          className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-[4px] hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          {ref}
                        </Link>
                      ))}
                    </div>

                    {/* Common Salient Keywords */}
                    {group.common_keywords && group.common_keywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-text-secondary">Extracted Semantic Tokens:</span>
                        {group.common_keywords.map((kw, kIdx) => (
                          <span
                            key={kIdx}
                            className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900 px-1.5 py-0.5 rounded-[3px] text-[10px]"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active Master Tickets */}
      {activeSubTab === "tickets" && (
        <div className="space-y-5">
          {tickets.length === 0 ? (
            <div className="text-center py-16 bg-white/50 dark:bg-[#07050E]/50 border border-dashed border-rule rounded-xl space-y-3">
              <Layers className="h-10 w-10 text-text-secondary mx-auto" />
              <h3 className="font-serif text-base font-semibold text-ink">
                No Master Tickets generated yet
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Master Tickets are created by running AI Cluster Detection in Tab 1 and consolidating related student grievances.
              </p>
              <Button
                onClick={() => setActiveSubTab("clusters")}
                size="sm"
                className="bg-purple-600 text-white text-xs h-8"
              >
                Go to Cluster Detection
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tickets.map((ticket) => {
                const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
                return (
                  <div
                    key={ticket.id}
                    className="bg-white/85 dark:bg-[#0B0813]/85 backdrop-blur-md border border-rule p-5 rounded-xl shadow-xs space-y-4 hover:border-purple-300 dark:hover:border-purple-800 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-semibold text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-[4px] border border-purple-200">
                            {ticket.ticket_reference_id}
                          </span>
                          <Badge
                            className={`text-[10px] font-semibold ${
                              isResolved
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200"
                            }`}
                          >
                            {ticket.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {ticket.bureau_code}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {ticket.category}
                          </Badge>
                        </div>

                        <h3 className="font-serif text-base font-semibold text-ink">
                          {ticket.consolidated_subject}
                        </h3>

                        <div className="text-xs text-text-secondary flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{ticket.institution_name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-ink font-mono">
                            {ticket.child_count} Complaints Linked
                          </div>
                          <div className="text-[10px] text-emerald-600 font-medium">
                            ~{ticket.time_saved_hours}h saved
                          </div>
                        </div>

                        {!isResolved ? (
                          <Button
                            onClick={() => handleOpenResolveModal(ticket)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 gap-1.5 font-medium shadow-xs"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            1-Click Cascade Resolve
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs py-1 px-2.5">
                            Resolved &amp; Cascaded
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Children preview */}
                    {ticket.children && ticket.children.length > 0 && (
                      <div className="pt-2 border-t border-rule/60 space-y-2">
                        <div className="text-[11px] font-medium text-text-secondary">
                          Linked Child Grievances ({ticket.children.length}):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {ticket.children.map((child) => (
                            <Link
                              key={child.id}
                              to="/cases/$id"
                              params={{ id: child.case_reference_id }}
                              className="p-2 rounded-lg bg-surface border border-rule/80 text-xs hover:border-purple-300 transition-colors block"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                                  {child.case_reference_id}
                                </span>
                                {child.is_anchor && (
                                  <span className="text-[9px] bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-1 rounded-sm">
                                    Anchor
                                  </span>
                                )}
                              </div>
                              <div className="text-ink truncate text-[11px] mt-0.5">
                                {child.subject}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Institutional Hotspots */}
      {activeSubTab === "institutions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-text-secondary" />
              <Input
                placeholder="Search college name or AICTE ID..."
                value={breakdownSearch}
                onChange={(e) => setBreakdownSearch(e.target.value)}
                className="pl-9 h-9 text-xs border-rule bg-white dark:bg-[#0B0813]"
              />
            </div>
            <div className="text-xs text-text-secondary">
              Showing {filteredBreakdowns.length} institutions with recurring clusters
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredBreakdowns.map((inst, idx) => (
              <div
                key={idx}
                className="bg-white/85 dark:bg-[#0B0813]/85 backdrop-blur-md border border-rule p-4 rounded-xl shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-serif text-sm font-semibold text-ink">
                      {inst.institution_name || inst.name}
                    </h4>
                    <div className="text-xs text-text-secondary flex items-center gap-2">
                      <span className="font-mono text-[11px]">{inst.aicte_permanent_id}</span>
                      <span>•</span>
                      <span>{inst.state || "India"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/40 text-xs">
                      {inst.total_clusters ?? inst.cluster_count ?? 1} Systemic Clusters
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1-Click Cascading Bulk Resolution Modal */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-semibold flex items-center gap-2 text-ink">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              1-Click Cascading Bulk Resolution
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Resolving Master Ticket <strong className="font-mono text-purple-600">{selectedTicket?.ticket_reference_id}</strong> will
              automatically transition all linked child complaint dossiers to <strong>Resolved</strong>, log immutable audit events,
              and notify complainants.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="text-xs font-medium text-ink">
              Official Resolution Order &amp; Compliance Remarks:
            </div>
            <Textarea
              rows={4}
              value={resolveRemarks}
              onChange={(e) => setResolveRemarks(e.target.value)}
              className="text-xs border-rule resize-none"
            />
            <p className="text-[11px] text-text-secondary">
              This order will be appended as the closure remarks to each individual complaint case.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResolveModalOpen(false)}
              className="text-xs h-8 border-rule"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmResolve}
              disabled={resolving || !resolveRemarks.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
            >
              {resolving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Confirm Bulk Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
