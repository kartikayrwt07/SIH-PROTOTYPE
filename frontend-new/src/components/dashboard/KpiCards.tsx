import React from "react";
import type { DashboardStats } from "@/types/ui";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  stats: DashboardStats;
}

export function KpiCards({ stats }: KpiCardsProps) {
  const resolvedClosedTotal = stats.resolved_cases + stats.closed_cases;
  const resolutionPct = Math.round(stats.resolution_rate * 100);

  const kpis = [
    {
      title: "Total Cases",
      value: stats.total_cases,
      subtext: "All grievances",
      valueClass: "text-foreground",
    },
    {
      title: "Active Cases",
      value: stats.active_cases,
      subtext: "In progress",
      valueClass: "text-foreground",
    },
    {
      title: "Approaching SLA",
      value: stats.approaching_cases,
      subtext: "< 48h window",
      valueClass: stats.approaching_cases > 0 ? "text-amber-600 dark:text-amber-500" : "text-foreground",
    },
    {
      title: "Overdue",
      value: stats.overdue_cases,
      subtext: "Breached SLA",
      valueClass: stats.overdue_cases > 0 ? "text-rose-600 dark:text-rose-500" : "text-foreground",
    },
    {
      title: "Resolved / Closed",
      value: resolvedClosedTotal,
      subtext: `${stats.resolved_cases} res · ${stats.closed_cases} cls`,
      valueClass: "text-foreground",
    },
    {
      title: "Resolution Rate",
      value: `${resolutionPct}%`,
      subtext: "Compliance",
      valueClass: "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border border-border/60 bg-card rounded-lg shadow-none">
          <CardContent className="p-3.5 space-y-1">
            <div className="text-xs font-medium text-muted-foreground truncate">
              {kpi.title}
            </div>
            <div className={cn("text-2xl font-semibold tracking-tight", kpi.valueClass)}>
              {kpi.value}
            </div>
            <div className="text-[11px] text-muted-foreground/70 truncate">
              {kpi.subtext}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
