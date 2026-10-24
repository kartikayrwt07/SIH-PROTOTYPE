import React from "react";
import { AlertOctagon, ClockAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SlaRadarSummary } from "@/types/ui";
import { Skeleton } from "@/components/ui/skeleton";

interface SlaSummaryTilesProps {
  summary?: SlaRadarSummary;
  isLoading: boolean;
}

export function SlaSummaryTiles({ summary, isLoading }: SlaSummaryTilesProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border shadow-2xs">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-3 w-44" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { overdue_count, approaching_count, on_track_count, total_active_cases } = summary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Overdue Tile */}
      <Card className="border border-border/60 bg-card rounded-lg shadow-none">
        <CardContent className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Overdue</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium">
              Breached
            </span>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-400">
            {overdue_count}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {overdue_count} of {total_active_cases} active cases breached deadline
          </p>
        </CardContent>
      </Card>

      {/* 2. Approaching Breach Tile */}
      <Card className="border border-border/60 bg-card rounded-lg shadow-none">
        <CardContent className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Approaching SLA</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
              &lt; 48h
            </span>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
            {approaching_count}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {approaching_count} cases at imminent breach risk
          </p>
        </CardContent>
      </Card>

      {/* 3. On Track Tile */}
      <Card className="border border-border/60 bg-card rounded-lg shadow-none">
        <CardContent className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">On Track</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
              Compliant
            </span>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-foreground">
            {on_track_count}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {on_track_count} cases within resolution targets
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
