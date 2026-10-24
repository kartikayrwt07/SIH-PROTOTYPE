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
      <Card className="border-border hover:border-primary/50 transition-all duration-200 hover:shadow-xs group-hover:-translate-y-0.5 cursor-pointer">
        <CardContent className="p-4 space-y-3">
          {/* Card Top: Code + Name */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="font-mono text-xs font-bold px-1.5 py-0 border-primary/40 text-primary bg-primary/5"
                >
                  {stat.bureau_code}
                </Badge>
                {hasOverdue && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold px-1.5 py-0 bg-red-50 text-red-700 border-red-200 gap-1"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {stat.overdue} Overdue
                  </Badge>
                )}
              </div>
              <h4 className="text-sm font-semibold text-foreground mt-1 line-clamp-1 group-hover:text-primary transition-colors">
                {stat.bureau_name}
              </h4>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
          </div>

          {/* Counts */}
          <div className="grid grid-cols-3 gap-2 py-1 text-center bg-muted/30 rounded-md border border-border/50 text-xs">
            <div>
              <div className="text-[10px] text-muted-foreground">Total</div>
              <div className="text-sm font-bold text-foreground">{stat.total}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Active</div>
              <div className="text-sm font-bold text-blue-600">{stat.active}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Resolved</div>
              <div className="text-sm font-bold text-green-600">{stat.resolved}</div>
            </div>
          </div>

          {/* Completion Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
              <span>Resolution Rate</span>
              <span className="font-semibold text-foreground">{completionPct}%</span>
            </div>
            <Progress value={completionPct} className="h-1.5 bg-muted" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
