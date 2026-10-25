import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, listCases, getTrustScores } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import {
  PageHeader,
  DataTable,
  type Column,
  LifecycleStrip,
  SlaPill,
} from "@/components/shared";
import { deriveSlaStatus } from "@/components/cases/SlaPill";
import { DwellTimeChart } from "./DwellTimeChart";
import { KpiCards } from "./KpiCards";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ComplaintCase, InstitutionTrustScore } from "@/types/ui";
import {
  AlertCircle,
  Building2,
  Award,
  ShieldAlert,
  CheckCircle,
  X,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export function DashboardView() {
  const navigate = useNavigate();
  const { role, user } = useRole();
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("ALL");

  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboardStats", role, user?.bureau_id],
    queryFn: () => getDashboardStats(user?.bureau_id ?? undefined),
    staleTime: 30 * 1000,
  });

  const {
    data: casesResponse,
    isLoading: isCasesLoading,
  } = useQuery({
    queryKey: ["casesForDashboard", role, user?.bureau_id],
    queryFn: () => listCases({ page_size: 100 }),
    staleTime: 30 * 1000,
  });

  const {
    data: institutions = [],
  } = useQuery<InstitutionTrustScore[]>({
    queryKey: ["institutionsForDashboard"],
    queryFn: () => getTrustScores({}),
    staleTime: 5 * 60 * 1000,
  });

  const allCases: ComplaintCase[] = casesResponse?.items ?? [];

  // Filter cases if an institution is selected
  const activeCasesFiltered = useMemo(() => {
    if (selectedInstitutionId === "ALL") return allCases;
    return allCases.filter(
      (c) =>
        c.institution_id === selectedInstitutionId ||
        c.aicte_permanent_id === selectedInstitutionId ||
        c.institution_name?.toLowerCase() === selectedInstitutionId.toLowerCase()
    );
  }, [allCases, selectedInstitutionId]);

  // Selected institution detail record
  const selectedInstitution = useMemo(() => {
    if (selectedInstitutionId === "ALL") return null;
    return institutions.find(
      (i) =>
        i.institution_id === selectedInstitutionId ||
        i.aicte_permanent_id === selectedInstitutionId ||
        i.name.toLowerCase() === selectedInstitutionId.toLowerCase()
    ) ?? null;
  }, [institutions, selectedInstitutionId]);

  // Institution-specific calculated KPI metrics
  const institutionKpiStats = useMemo(() => {
    if (!selectedInstitution) return null;
    const instCases = activeCasesFiltered;
    const total = instCases.length;
    const active = instCases.filter((c) => c.status !== "Resolved" && c.status !== "Closed").length;
    const resolved = instCases.filter((c) => c.status === "Resolved").length;
    const closed = instCases.filter((c) => c.status === "Closed").length;
    const overdue = instCases.filter(
      (c) => c.status !== "Resolved" && c.status !== "Closed" && deriveSlaStatus(c.due_date).status === "OVERDUE"
    ).length;
    const approaching = instCases.filter(
      (c) => c.status !== "Resolved" && c.status !== "Closed" && deriveSlaStatus(c.due_date).status === "APPROACHING"
    ).length;
    const rate = total > 0 ? (resolved + closed) / total : 1;

    return {
      total_cases: total,
      active_cases: active,
      resolved_cases: resolved,
      closed_cases: closed,
      overdue_cases: overdue,
      approaching_cases: approaching,
      resolution_rate: rate,
    };
  }, [selectedInstitution, activeCasesFiltered]);

  // Sort and pick at most 10 cases that need action today: Overdue first, then Approaching
  const actionCases = useMemo(() => {
    const active = activeCasesFiltered.filter((c) => c.status !== "Resolved" && c.status !== "Closed");
    const overdue = active.filter((c) => deriveSlaStatus(c.due_date).status === "OVERDUE");
    const approaching = active.filter((c) => deriveSlaStatus(c.due_date).status === "APPROACHING");

    return [...overdue, ...approaching].slice(0, 10);
  }, [activeCasesFiltered]);

  // Derive "due soon" count per bureau
  const bureauWorkloadData = useMemo(() => {
    if (!stats?.bureau_breakdown) return [];

    return stats.bureau_breakdown.map((b) => {
      const dueSoonCalculated = activeCasesFiltered.filter((c) => {
        if (c.bureau_id !== b.bureau_id) return false;
        if (c.status === "Resolved" || c.status === "Closed") return false;
        return deriveSlaStatus(c.due_date).status === "APPROACHING";
      }).length;

      const dueSoonCount = (b as any).approaching && (b as any).approaching > 0 ? (b as any).approaching : dueSoonCalculated;
      const completionPct = b.total > 0 ? Math.round((b.resolved / b.total) * 100) : 0;

      return {
        ...b,
        dueSoon: dueSoonCount,
        completionPct,
      };
    });
  }, [stats?.bureau_breakdown, activeCasesFiltered]);

  // Action table columns
  const actionColumns: Column<ComplaintCase>[] = [
    {
      key: "case_reference_id",
      header: "Case",
      width: "140px",
      cell: (c) => (
        <span className="font-mono text-xs text-[var(--color-text-secondary)]">
          {c.case_reference_id}
        </span>
      ),
    },
    {
      key: "institution_name",
      header: "Institution",
      cell: (c) => (
        <div className="py-0.5">
          <div className="font-medium text-[var(--color-text-primary)] text-xs line-clamp-1">
            {c.institution_name}
          </div>
          <div className="font-mono text-[10px] text-[var(--color-text-muted)] mt-0.5">
            {c.aicte_permanent_id ? c.aicte_permanent_id : "—"}
          </div>
        </div>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      width: "230px",
      cell: (c) => (
        <div className="flex items-center">
          <LifecycleStrip status={c.status} variant="compact" />
        </div>
      ),
    },
    {
      key: "due",
      header: "Due",
      width: "150px",
      align: "right",
      cell: (c) => <SlaPill dueDate={c.due_date} isResolved={false} />,
    },
  ];

  // Bureau workload columns
  type BureauRow = (typeof bureauWorkloadData)[number];
  const bureauColumns: Column<BureauRow>[] = [
    {
      key: "bureau",
      header: "Bureau",
      cell: (b) => (
        <div className="py-0.5">
          <span className="font-medium text-[var(--color-text-primary)] text-xs">
            {b.bureau_name}
          </span>
          <span className="font-mono text-[10px] text-[var(--color-text-muted)] ml-2">
            ({b.bureau_code})
          </span>
        </div>
      ),
    },
    {
      key: "active",
      header: "Open",
      align: "right",
      width: "80px",
      cell: (b) => <span className="tabular-nums text-xs">{b.active}</span>,
    },
    {
      key: "overdue",
      header: "Overdue",
      align: "right",
      width: "90px",
      cell: (b) => (
        <span
          className={`tabular-nums text-xs ${
            b.overdue > 0
              ? "text-[var(--sla-overdue-text)] font-semibold"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          {b.overdue}
        </span>
      ),
    },
    {
      key: "dueSoon",
      header: "Due soon",
      align: "right",
      width: "90px",
      cell: (b) => (
        <span
          className={`tabular-nums text-xs ${
            b.dueSoon > 0
              ? "text-[var(--sla-approaching-text)] font-semibold"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          {b.dueSoon}
        </span>
      ),
    },
    {
      key: "resolved",
      header: "Resolved",
      align: "right",
      width: "90px",
      cell: (b) => <span className="tabular-nums text-xs">{b.resolved}</span>,
    },
    {
      key: "rate",
      header: "Resolution rate",
      align: "right",
      width: "180px",
      cell: (b) => (
        <div className="flex items-center justify-end gap-3 py-0.5">
          <span className="tabular-nums text-xs text-[var(--color-ink)] font-semibold">
            {b.completionPct}%
          </span>
          <div className="w-24 h-2 bg-[var(--color-page)] border border-[var(--color-rule)] rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-action)] to-[#8E72D6] rounded-full transition-all duration-500"
              style={{ width: `${b.completionPct}%` }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Header & Institution-Level Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-rule)] pb-4">
        <div>
          <PageHeader
            title="Executive Dashboard"
            description="Jurisdictional SLA monitoring and institutional risk governance."
          />
        </div>

        {/* Institution-Level Filter Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Select
              value={selectedInstitutionId}
              onValueChange={(val) => setSelectedInstitutionId(val)}
            >
              <SelectTrigger className="h-9 w-full text-xs bg-surface border-[var(--color-rule)] rounded-[8px] shadow-xs">
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="h-3.5 w-3.5 text-[var(--color-action)] shrink-0" />
                  <SelectValue placeholder="Filter by Institution..." />
                </div>
              </SelectTrigger>
              <SelectContent align="end" className="max-h-72 w-84 text-xs bg-surface border-[var(--color-rule)]">
                <SelectItem value="ALL" className="font-medium text-xs">
                  All Institutions (National View)
                </SelectItem>
                {institutions.map((inst) => (
                  <SelectItem key={inst.institution_id} value={inst.institution_id} className="text-xs">
                    <div className="flex flex-col text-left py-0.5">
                      <span className="font-semibold text-ink truncate">{inst.name}</span>
                      <span className="text-[10px] text-text-muted font-mono">
                        {inst.aicte_permanent_id} · {inst.district}, {inst.state}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedInstitutionId !== "ALL" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedInstitutionId("ALL")}
              className="h-9 px-2 text-xs text-text-muted hover:text-ink shrink-0"
              title="Reset to all institutions"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* DEDICATED INSTITUTION HEALTH CARD (When an Institution is filtered) */}
      {selectedInstitution && institutionKpiStats ? (
        <div className="p-5 sm:p-6 bg-gradient-to-br from-white/90 via-purple-50/20 to-white/90 dark:from-[#0E0A1A]/95 dark:via-[#160E28]/90 dark:to-[#0A0714]/95 backdrop-blur-md border border-[#ECE6F4] dark:border-[#2A1845] rounded-[14px] shadow-[0_8px_32px_rgba(112,82,200,0.06)] space-y-5 animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-[#7052C8]/15 dark:bg-[#9333EA]/25 text-[#7052C8] dark:text-[#C084FC] border-[#7052C8]/30 dark:border-[#9333EA]/40 text-xs gap-1 font-semibold">
                  <Building2 className="h-3 w-3" />
                  College Dedicated Health Card
                </Badge>
                <span className="text-xs font-mono text-[var(--color-text-muted)]">
                  {selectedInstitution.aicte_permanent_id}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {selectedInstitution.district}, {selectedInstitution.state}
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--color-ink)] tracking-tight">
                {selectedInstitution.name}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Trust Score</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black tabular-nums text-ink">
                    {selectedInstitution.trust_score}
                  </span>
                  <span className="text-xs text-text-muted">/100</span>
                </div>
              </div>

              <Badge
                className={
                  selectedInstitution.risk_tier === "HIGH_RISK"
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs px-2.5 py-1"
                    : selectedInstitution.risk_tier === "MODERATE_RISK"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs px-2.5 py-1"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-1"
                }
              >
                {selectedInstitution.risk_tier.replace("_", " ")}
              </Badge>

              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 border-rule bg-surface hover:bg-page"
              >
                <Link to="/institutions">
                  <span>Leaderboard</span>
                  <ExternalLink className="h-3 w-3 ml-0.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* College KPI Ribbon */}
          <KpiCards stats={institutionKpiStats as any} />
        </div>
      ) : (
        /* NATIONAL KPI METRICS RIBBON (Whole System Overview) */
        <div className="space-y-4">
          {isStatsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : isStatsError || !stats ? (
            <div className="flex items-center justify-between p-4 text-xs bg-[var(--sla-overdue-bg)] dark:bg-[#2B1015]/50 text-[var(--sla-overdue-text)] dark:text-[#F87171] border border-[var(--sla-overdue-text)]/20 dark:border-[#F87171]/35 rounded-[6px]">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Failed to load summary statistics: {(statsError as Error)?.message || "Unknown error"}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => refetchStats()} className="h-7 text-xs border-[var(--sla-overdue-text)]/30">
                Try again
              </Button>
            </div>
          ) : (
            <KpiCards stats={stats} />
          )}
        </div>
      )}

      {/* Section: Cases that need action today */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--color-rule)] pb-3">
          <div>
            <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">
              {selectedInstitution ? `Action cases for ${selectedInstitution.name}` : "Cases that need action today"}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Priority complaints ranked by deadline proximity requiring immediate desk attention.
            </p>
          </div>
          <Link
            to="/cases"
            className="text-xs font-medium text-[var(--color-action)] hover:underline"
          >
            View all in the register →
          </Link>
        </div>

        <DataTable
          columns={actionColumns}
          data={actionCases}
          keyField={(c) => c.id}
          isLoading={isCasesLoading}
          skeletonRows={5}
          onRowClick={(c) =>
            navigate({
              to: "/cases/$id",
              params: { id: c.case_reference_id },
            })
          }
          emptyMessage="No urgent cases requiring immediate intervention today."
          emptyInstruction="All open grievances are within acceptable SLA limits."
        />
      </section>

      {/* Section: Workload by bureau */}
      <section className="space-y-4">
        <div className="border-b border-[var(--color-rule)] pb-3">
          <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">
            Workload by bureau
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Jurisdictional distribution of active caseloads, overdue breach volumes, and determination rates.
          </p>
        </div>

        <DataTable
          columns={bureauColumns}
          data={bureauWorkloadData}
          keyField={(b) => b.bureau_id}
          isLoading={isStatsLoading}
          skeletonRows={4}
          onRowClick={(b) =>
            navigate({
              to: "/cases",
              search: { bureau_id: b.bureau_id },
            })
          }
          emptyMessage="No bureau workload data found."
          emptyInstruction="Verify API connection or active bureau records."
        />
      </section>

      {/* Section: Where cases wait longest */}
      <section>
        {isCasesLoading ? (
          <Skeleton className="h-56 w-full rounded-[6px]" />
        ) : (
          <DwellTimeChart cases={activeCasesFiltered} />
        )}
      </section>
    </div>
  );
}
