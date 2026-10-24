import React from "react";
import { Link } from "@tanstack/react-router";
import type { SlaRadarItem } from "@/types/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/cases/PriorityBadge";
import {
  ClockAlert,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIstDate } from "@/lib/dateUtils";
import { CountdownTimer } from "./CountdownTimer";

interface ApproachingTableProps {
  items: SlaRadarItem[];
  isLoading: boolean;
}

export function ApproachingTable({ items, isLoading }: ApproachingTableProps) {
  return (
    <Card className="border border-border/60 shadow-none overflow-hidden bg-card">
      <CardHeader className="border-b border-border/40 py-3.5 px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Approaching SLA</span>
              <span className="text-xs font-normal text-muted-foreground">
                ({items.length})
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Cases within 48 hours of their resolution target.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">No Approaching Breaches</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No active grievances are within the 48-hour deadline horizon.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Case Ref</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Subject & Category</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Bureau</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Priority</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Institution</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Statutory Due Date</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Time Remaining</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr
                    key={item.case_reference_id}
                    className="hover:bg-amber-50/20 transition-colors group"
                  >
                    {/* Case Ref */}
                    <td className="py-3 px-4 align-top">
                      <Link
                        to={`/cases/${item.case_reference_id}`}
                        className="font-mono text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        {item.case_reference_id}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>

                    {/* Subject & Category */}
                    <td className="py-3 px-4 align-top max-w-xs">
                      <div className="font-medium text-foreground line-clamp-1">
                        {item.subject}
                      </div>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 mt-0.5 font-normal text-muted-foreground">
                        {item.category}
                      </Badge>
                    </td>

                    {/* Bureau */}
                    <td className="py-3 px-4 align-top">
                      <span className="font-semibold text-foreground">
                        {item.bureau_code ?? "—"}
                      </span>
                      <span className="block text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {item.bureau_name}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 align-top">
                      <PriorityBadge priority={item.priority} />
                    </td>

                    {/* Institution */}
                    <td className="py-3 px-4 align-top max-w-[180px]">
                      <span className="font-medium text-foreground block truncate" title={item.institution_name ?? ""}>
                        {item.institution_name || "N/A"}
                      </span>
                    </td>

                    {/* Statutory Due Date */}
                    <td className="py-3 px-4 align-top font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {item.due_date ? formatIstDate(item.due_date) : "—"}
                    </td>

                    {/* Time Remaining (Live countdown) */}
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <CountdownTimer dueDate={item.due_date} />
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2.5 gap-1 shadow-2xs hover:border-amber-300"
                      >
                        <Link to={`/cases/${item.case_reference_id}`}>
                          <span>View Dossier</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
