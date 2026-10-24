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
      <Card className="border-red-200 bg-red-50/20 shadow-2xs relative overflow-hidden group hover:border-red-300 transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-900/80">
                Overdue Cases
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600 tabular-nums">
              {overdue_count}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              of {total_active_cases} active
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-red-700/80 leading-tight">
              Past statutory resolution deadline.
            </p>
            <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider py-0 px-1.5">
              Breached
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 2. Approaching Breach Tile */}
      <Card className="border-amber-200 bg-amber-50/20 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-900/80">
                Approaching SLA (&lt; 48h)
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <ClockAlert className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 tabular-nums">
              {approaching_count}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              at imminent breach risk
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-amber-800/80 leading-tight">
              Due within the next 48 hours.
            </p>
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] uppercase font-bold tracking-wider py-0 px-1.5 hover:bg-amber-100">
              Warning
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 3. On Track Tile */}
      <Card className="border-emerald-200 bg-emerald-50/20 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900/80">
                On Track (Compliant)
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 tabular-nums">
              {on_track_count}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              within prescribed targets
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-emerald-800/80 leading-tight">
              Compliant with procedural norms.
            </p>
            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] uppercase font-bold tracking-wider py-0 px-1.5 hover:bg-emerald-100">
              Compliant
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
