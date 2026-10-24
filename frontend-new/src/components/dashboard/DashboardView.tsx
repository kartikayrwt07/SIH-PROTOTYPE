import React, { useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, listCases } from "@/api/index";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComplaintCase, BureauStat } from "@/types/ui";
import { AlertCircle } from "lucide-react";

export function DashboardView() {
  const navigate = useNavigate();
  const { role, user } = useRole();

  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboardStats", role, user?.bureau_id],
    queryFn: getDashboardStats,
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

  const allCases: ComplaintCase[] = casesResponse?.items ?? [];

  // Sort and pick at most 10 cases that need action today: Overdue first, then Approaching
  const actionCases = useMemo(() => {
    const active = allCases.filter((c) => c.status !== "Resolved" && c.status !== "Closed");
    const overdue = active.filter((c) => deriveSlaStatus(c.due_date).status === "OVERDUE");
    const approaching = active.filter((c) => deriveSlaStatus(c.due_date).status === "APPROACHING");

    return [...overdue, ...approaching].slice(0, 10);
  }, [allCases]);

  // Derive "due soon" count per bureau
  const bureauWorkloadData = useMemo(() => {
    if (!stats?.bureau_breakdown) return [];

    return stats.bureau_breakdown.map((b) => {
      const dueSoonCount = allCases.filter((c) => {
        if (c.bureau_id !== b.bureau_id) return false;
        if (c.status === "Resolved" || c.status === "Closed") return false;
        return deriveSlaStatus(c.due_date).status === "APPROACHING";
      }).length;

      const completionPct = b.total > 0 ? Math.round((b.resolved / b.total) * 100) : 0;

      return {
        ...b,
        dueSoon: dueSoonCount,
        completionPct,
      };
    });
  }, [stats?.bureau_breakdown, allCases]);

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
        <div>
          <div className="font-medium text-[var(--color-text-primary)] text-xs line-clamp-1">
            {c.institution_name}
          </div>
          <div className="font-mono text-[10px] text-[var(--color-text-muted)]">
            {c.aicte_permanent_id ? c.aicte_permanent_id : "—"}
          </div>
        </div>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      width: "220px",
      cell: (c) => (
        <div className="flex items-center">
          <LifecycleStrip currentStatus={c.status} variant="compact" />
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
        <div>
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
      width: "160px",
      cell: (b) => (
        <div className="flex items-center justify-end gap-2.5">
          <span className="tabular-nums text-xs text-[var(--color-text-secondary)]">
            {b.completionPct}%
          </span>
          <div className="w-16 h-1.5 bg-[var(--color-page)] border border-[var(--color-rule)] rounded-[2px] overflow-hidden">
            <div
              className="h-full bg-[var(--color-action)]"
              style={{ width: `${b.completionPct}%` }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="py-6 px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header & KPI Summary Sentence */}
      <div className="space-y-2">
        <PageHeader title="Dashboard" />

        {isStatsLoading ? (
          <Skeleton className="h-5 w-80 rounded" />
        ) : isStatsError || !stats ? (
          <div className="flex items-center justify-between p-3 text-xs bg-red-50 text-[var(--sla-overdue-text)] border border-red-200 rounded-[4px]">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to load summary statistics: {(statsError as Error)?.message || "Unknown error"}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetchStats()} className="h-7 text-xs">
              Try again
            </Button>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] -mt-2">
            <span className="font-semibold text-[var(--sla-overdue-text)] tabular-nums">
              {stats.overdue_cases}
            </span>{" "}
            overdue,{" "}
            <span className="font-semibold text-[var(--sla-approaching-text)] tabular-nums">
              {stats.approaching_cases}
            </span>{" "}
            due within 48 hours,{" "}
            <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
              {stats.active_cases}
            </span>{" "}
            open. Resolution rate{" "}
            <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
              {Math.round(stats.resolution_rate * 100)}%
            </span>
            .
          </p>
        )}
      </div>

      {/* Section: Cases that need action today */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between border-b border-[var(--color-rule)] pb-2">
          <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">
            Cases that need action today
          </h2>
          <Link
            to="/cases"
            className="text-xs font-medium text-[var(--color-action)] hover:underline"
          >
            View all in the register
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
      <section className="space-y-3">
        <div className="border-b border-[var(--color-rule)] pb-2">
          <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">
            Workload by bureau
          </h2>
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
          <Skeleton className="h-48 w-full rounded" />
        ) : (
          <DwellTimeChart cases={allCases} />
        )}
      </section>
    </div>
  );
}
