import React from "react";
import { Link } from "@tanstack/react-router";
import type { BureauStat } from "@/types/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BureauCardProps {
  stat: BureauStat;
}

export function BureauCard({ stat }: BureauCardProps) {
  const completionPct = stat.total > 0 ? Math.round((stat.resolved / stat.total) * 100) : 0;
  const hasOverdue = stat.overdue > 0;

  return (
    <Link
      to="/cases"
      search={{ bureau_id: stat.bureau_id }}
      className="block group focus:outline-none"
    >
      <Card className="border border-border/60 bg-card rounded-lg hover:border-border transition-colors shadow-none cursor-pointer">
        <CardContent className="p-4 space-y-3">
          {/* Card Top: Code + Name */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-foreground">
                  {stat.bureau_code}
                </span>
                {hasOverdue && (
                  <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                    {stat.overdue} overdue
                  </span>
                )}
              </div>
              <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {stat.bureau_name}
              </h4>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors flex-shrink-0 mt-0.5" />
          </div>

          {/* Clean Metric Row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <div>
              <span className="text-foreground font-semibold">{stat.active}</span> active
            </div>
            <div>
              <span className="text-foreground font-semibold">{stat.resolved}</span> resolved
            </div>
            <div>
              <span className="text-foreground font-semibold">{stat.total}</span> total
            </div>
          </div>

          {/* Minimal Progress */}
          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between items-center text-[10px] text-muted-foreground/80">
              <span>Resolution</span>
              <span>{completionPct}%</span>
            </div>
            <Progress value={completionPct} className="h-1 bg-muted" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
