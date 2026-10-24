import React from "react";
import { Link } from "@tanstack/react-router";
import type { SlaRadarItem } from "@/types/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/cases/PriorityBadge";
import {
  AlertOctagon,
  ArrowUpRight,
  ExternalLink,
  Lock,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIstDate } from "@/lib/dateUtils";

interface OverdueTableProps {
  items: SlaRadarItem[];
  isLoading: boolean;
  userRole: string;
  onEscalate: (item: SlaRadarItem) => void;
}

export function OverdueTable({
  items,
  isLoading,
  userRole,
  onEscalate,
}: OverdueTableProps) {
  const canEscalate = userRole === "ADMIN" || userRole === "SUPERVISOR";
  const isAuditor = userRole === "AUDITOR";

  return (
    <Card className="border border-border/60 shadow-none overflow-hidden bg-card">
      <CardHeader className="border-b border-border/40 py-3.5 px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Overdue Cases</span>
              <span className="text-xs font-normal text-muted-foreground">
                ({items.length})
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Cases that have exceeded statutory turnaround norms.
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
            <h4 className="text-sm font-semibold text-foreground">Zero Overdue Cases</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              All active grievances in the selected scope are currently within statutory SLA timelines.
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
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Breach Duration</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Surveillance Tier</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const hoursOverdue =
                    item.hours_remaining !== null
                      ? Math.abs(item.hours_remaining)
                      : null;

                  const isMaxTier = item.escalation_level >= 2;

                  return (
                    <tr
                      key={item.case_reference_id}
                      className="hover:bg-red-50/20 transition-colors group"
                    >
                      {/* Case Ref */}
                      <td className="py-3 px-4 align-top">
                        <Link
                          to="/cases/$id"
                          params={{ id: item.case_reference_id }}
                          className="font-mono text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          {item.case_reference_id}
                          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {item.due_date && (
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            Due: {formatIstDate(item.due_date)}
                          </span>
                        )}
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

                      {/* Breach Duration */}
                      <td className="py-3 px-4 align-top">
                        <div className="inline-flex items-center gap-1 text-red-600 font-mono font-bold text-xs bg-red-100/70 border border-red-200 px-2 py-0.5 rounded">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                          <span>
                            {hoursOverdue !== null
                              ? `${hoursOverdue.toFixed(1)}h overdue`
                              : "Overdue"}
                          </span>
                        </div>
                      </td>

                      {/* Escalation Tier */}
                      <td className="py-3 px-4 align-top">
                        {item.escalation_level === 0 ? (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Tier 0 (Standard)
                          </Badge>
                        ) : item.escalation_level === 1 ? (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-semibold">
                            Tier 1 (Priority)
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] font-semibold">
                            Tier 2 (Apex)
                          </Badge>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEscalate ? (
                            <Button
                              size="sm"
                              variant={isMaxTier ? "outline" : "destructive"}
                              disabled={isMaxTier}
                              onClick={() => onEscalate(item)}
                              className="h-7 text-xs px-2.5 gap-1 shadow-2xs"
                              title={isMaxTier ? "Already at maximum escalation Tier 2" : "Advance surveillance escalation level"}
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>{isMaxTier ? "Max Escalated" : "Escalate"}</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="h-7 text-xs px-2 gap-1 opacity-60 cursor-not-allowed"
                              title={
                                isAuditor
                                  ? "Auditor role has read-only privileges"
                                  : "Escalations restricted to ADMIN and SUPERVISOR"
                              }
                            >
                              <Lock className="h-3 w-3" />
                              <span>Locked</span>
                            </Button>
                          )}

                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Open Dossier"
                          >
                            <Link to="/cases/$id" params={{ id: item.case_reference_id }}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
