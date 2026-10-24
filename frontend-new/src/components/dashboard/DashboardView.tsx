import React from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, listCases } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import { KpiCards } from "./KpiCards";
import { BureauCard } from "./BureauCard";
import { DwellTimeChart } from "./DwellTimeChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FolderOpen, ArrowRight, Building } from "lucide-react";

export function DashboardView() {
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

  const allCases = casesResponse?.items ?? [];

  return (
    <div className="container max-w-7xl mx-auto py-6 px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Complaint Surveillance Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            Overview of active grievances, SLA compliance, and bureau resolution throughput.
          </p>
        </div>

        <Button asChild size="sm" variant="outline" className="self-start sm:self-auto text-xs gap-1.5 h-8 border-border/60 hover:bg-muted/50">
          <Link to="/cases">
            <FolderOpen className="h-3.5 w-3.5 opacity-70" />
            <span>Case Register</span>
            <ArrowRight className="h-3 w-3 opacity-50" />
          </Link>
        </Button>
      </div>

      {/* Officer Scoping Notice if scoped */}
      {role === "OFFICER" && user?.bureau_name && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs bg-muted/50 border border-border/60 text-muted-foreground rounded-lg">
          <Building className="h-3.5 w-3.5 text-foreground flex-shrink-0" />
          <span>
            Jurisdiction: <strong className="text-foreground">{user.bureau_name} ({user.bureau_code})</strong>
          </span>
        </div>
      )}

      {/* KPI Cards Row */}
      {isStatsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : isStatsError || !stats ? (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-center justify-between text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>
              Failed to load KPI statistics:{" "}
              {(statsError as Error)?.message || "Unknown error"}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetchStats()} className="h-7 text-xs">
            Retry
          </Button>
        </div>
      ) : (
        <KpiCards stats={stats} />
      )}

      {/* 4 Bureau Overview Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bureau Jurisdictions
          </h3>
        </div>

        {isStatsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats?.bureau_breakdown.map((bureauStat) => (
              <BureauCard key={bureauStat.bureau_id} stat={bureauStat} />
            ))}
          </div>
        )}
      </div>

      {/* Dwell Time & SLA Bottlenecks Bar Chart */}
      {isCasesLoading ? (
        <Skeleton className="h-80 w-full rounded-lg" />
      ) : (
        <DwellTimeChart cases={allCases} />
      )}
    </div>
  );
}
