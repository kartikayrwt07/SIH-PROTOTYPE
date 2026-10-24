import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getAssignmentHistory } from "@/api/index";
import type { AssignmentHistoryEntry } from "@/types/ui";
import { formatIST } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserCheck,
  ArrowRight,
  Shield,
  Clock,
  Inbox,
} from "lucide-react";

interface AssignmentHistoryTabProps {
  caseRef: string;
}

export function AssignmentHistoryTab({ caseRef }: AssignmentHistoryTabProps) {
  const { data: history = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["history", caseRef],
    queryFn: () => getAssignmentHistory(caseRef),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-xs text-destructive space-y-2">
        <p>Failed to retrieve assignment history: {(error as Error)?.message || "Unknown error"}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-7">
          Retry
        </Button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
        <Inbox className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2 stroke-1" />
        <p className="font-medium text-foreground">No jurisdiction transfers recorded</p>
        <p>Case remains within its initial intake bureau allocation.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-[11px] text-muted-foreground flex items-center justify-between border-b border-border pb-2">
        <span>Delegation and jurisdictional transfer logs ({history.length} records)</span>
        <span>Times shown in IST</span>
      </div>

      <div className="space-y-3">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="p-3.5 bg-card rounded-lg border border-border shadow-2xs text-xs space-y-2"
          >
            {/* Header: From -> To + Date */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-medium">
                <span className="text-muted-foreground">
                  {entry.from_bureau_name ?? "Initial Registry Allocation"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <Badge variant="outline" className="text-xs font-semibold bg-primary/5 text-primary border-primary/30">
                  <Shield className="h-3 w-3 mr-1" />
                  {entry.to_bureau_name ?? entry.to_bureau_id}
                </Badge>
              </div>

              <time className="text-[10px] text-muted-foreground flex items-center gap-1 tabular-nums">
                <Clock className="h-3 w-3" />
                {formatIST(entry.created_at)}
              </time>
            </div>

            {/* Transfer Reason */}
            <div className="p-2.5 rounded bg-muted/40 border border-border/60 text-foreground leading-relaxed">
              <span className="font-semibold text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">
                Transfer Justification
              </span>
              {entry.transfer_reason}
            </div>

            {/* Assigned by */}
            {entry.assigned_by_name && (
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-muted-foreground" />
                <span>Authorized by <strong>{entry.assigned_by_name}</strong></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
