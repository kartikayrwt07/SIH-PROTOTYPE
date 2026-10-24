import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTimeline } from "@/api/index";
import type { TimelineEntry } from "@/types/ui";
import { AUDIT_EVENT_LABELS } from "@/lib/stateMachine";
import { formatIST } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  CheckCircle2,
  GitCommit,
  UserCheck,
  FileText,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditTimelineTabProps {
  caseRef: string;
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  REGISTERED: CheckCircle2,
  STATUS_CHANGE: GitCommit,
  REASSIGNED: UserCheck,
  NOTE_ADDED: FileText,
  ESCALATED: AlertTriangle,
  RESOLVED: CheckCircle2,
  CLOSED: ShieldAlert,
  REOPENED: RotateCcw,
  TRIAGE_APPLIED: Sparkles,
};

export function AuditTimelineTab({ caseRef }: AuditTimelineTabProps) {
  const [expandedMeta, setExpandedMeta] = useState<Record<string, boolean>>({});

  const { data: timeline = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["timeline", caseRef],
    queryFn: () => getTimeline(caseRef),
    staleTime: 30 * 1000,
  });

  const toggleMeta = (id: string) => {
    setExpandedMeta((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-xs text-destructive space-y-2">
        <p>Failed to retrieve audit trail: {(error as Error)?.message || "Unknown error"}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-7">
          Retry
        </Button>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
        <History className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2 stroke-1" />
        <p className="font-medium text-foreground">No audit entries recorded yet</p>
        <p>Timeline entries will appear here as state advancements and reassignments occur.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-[11px] text-muted-foreground flex items-center justify-between border-b border-border pb-2">
        <span>Immutable chronological trail ({timeline.length} events)</span>
        <span>Times shown in IST</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
        {timeline.map((entry) => {
          const Icon = EVENT_ICONS[entry.event_type] ?? GitCommit;
          const isExpanded = !!expandedMeta[entry.id];
          const hasMeta = entry.metadata && Object.keys(entry.metadata).length > 0;

          return (
            <div key={entry.id} className="relative text-xs space-y-1.5">
              {/* Dot Icon */}
              <div className="absolute -left-[30px] top-0.5 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center text-primary shadow-2xs">
                <Icon className="h-3 w-3" />
              </div>

              {/* Event Header */}
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {AUDIT_EVENT_LABELS[entry.event_type] ?? entry.event_type}
                  </span>
                  {entry.previous_state && entry.new_state && entry.previous_state !== entry.new_state && (
                    <span className="text-[10px] text-muted-foreground">
                      ({entry.previous_state} → <strong className="text-foreground">{entry.new_state}</strong>)
                    </span>
                  )}
                  <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 h-4 border-border">
                    {entry.actor_role}
                  </Badge>
                </div>

                <time className="text-[10px] text-muted-foreground tabular-nums">
                  {formatIST(entry.timestamp)}
                </time>
              </div>

              {/* Remark */}
              {entry.remark && (
                <div className="text-xs text-foreground bg-muted/40 p-2.5 rounded-md border border-border/70 leading-relaxed">
                  {entry.remark}
                </div>
              )}

              {/* Collapsible Metadata */}
              {hasMeta && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleMeta(entry.id)}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <span>{isExpanded ? "Hide metadata" : "Inspect metadata payload"}</span>
                  </button>

                  {isExpanded && (
                    <pre className="mt-1 p-2 rounded bg-muted/70 text-[10px] font-mono overflow-x-auto text-foreground/80 border border-border">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
