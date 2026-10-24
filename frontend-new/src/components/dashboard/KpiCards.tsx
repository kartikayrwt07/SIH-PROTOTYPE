import React from "react";
import type { DashboardStats } from "@/types/ui";
import { Card, CardContent } from "@/components/ui/card";
import {
  FolderKanban,
  ClockAlert,
  Timer,
  CheckCircle,
  Activity,
  Percent,
} from "lucide-react";
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
      desc: "All recorded grievances",
      icon: FolderKanban,
      color: "text-foreground",
      border: "border-border",
    },
    {
      title: "Active Open",
      value: stats.active_cases,
      desc: "Pending full lifecycle resolution",
      icon: Activity,
      color: "text-blue-600",
      border: "border-border",
    },
    {
      title: "Approaching SLA",
      value: stats.approaching_cases,
      desc: "Within 48h resolution window",
      icon: Timer,
      color: "text-amber-600",
      border: stats.approaching_cases > 0 ? "border-amber-200 bg-amber-50/20" : "border-border",
    },
    {
      title: "Overdue",
      value: stats.overdue_cases,
      desc: "Breached resolution SLA",
      icon: ClockAlert,
      color: "text-red-600",
      border: stats.overdue_cases > 0 ? "border-red-200 bg-red-50/30" : "border-border",
    },
    {
      title: "Resolved / Closed",
      value: resolvedClosedTotal,
      desc: `${stats.resolved_cases} Resolved · ${stats.closed_cases} Closed`,
      icon: CheckCircle,
      color: "text-green-600",
      border: "border-border",
    },
    {
      title: "Resolution Rate",
      value: `${resolutionPct}%`,
      desc: "Overall compliance completion",
      icon: Percent,
      color: "text-primary",
      border: "border-border",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className={cn("shadow-2xs", kpi.border)}>
            <CardContent className="p-3.5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium uppercase tracking-wider line-clamp-1">
                  {kpi.title}
                </span>
                <Icon className={cn("h-4 w-4 flex-shrink-0 opacity-80", kpi.color)} />
              </div>
              <div className={cn("text-2xl font-bold tracking-tight", kpi.color)}>
                {kpi.value}
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">
                {kpi.desc}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
