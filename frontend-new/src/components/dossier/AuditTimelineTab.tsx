import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTimeline } from "@/api/index";
import type { TimelineEntry, CaseStatus } from "@/types/ui";
import { AUDIT_EVENT_LABELS } from "@/lib/stateMachine";
import { formatIST } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight } from "lucide-react";

interface AuditTimelineTabProps {
  caseRef: string;
}

const STATUS_COLOR_VARS: Record<CaseStatus, string> = {
  Received: "var(--status-received)",
  Registered: "var(--status-registered)",
  "Under Triage": "var(--status-under-triage)",
  Assigned: "var(--status-assigned)",
  "In Progress": "var(--status-in-progress)",
  "Awaiting Information": "var(--status-awaiting-information)",
  "Under Review": "var(--status-under-review)",
  Resolved: "var(--status-resolved)",
  Closed: "var(--status-closed)",
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
      <div className="space-y-4 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-3 w-3 rounded-[2px] mt-1 shrink-0" />
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
      <div className="py-6 text-xs text-[var(--sla-overdue-text)] space-y-2">
        <p>Failed to retrieve audit trail: {(error as Error)?.message || "Unknown error"}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-7 border-[var(--color-rule)]">
          Try again
        </Button>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="py-8 text-xs text-[var(--color-text-secondary)] space-y-1">
        <p className="font-medium text-[var(--color-text-primary)]">No timeline records found</p>
        <p>State advancements, assignments, and audit events will appear here in chronological sequence.</p>
      </div>
    );
  }

  return (
    <div className="py-3 space-y-4">
      {/* 1px vertical timeline with small square markers */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--color-rule)]">
        {timeline.map((entry) => {
          const statusKey = (entry.new_state || entry.previous_state) as CaseStatus | undefined;
          const markerColor = statusKey ? STATUS_COLOR_VARS[statusKey] || "var(--color-text-muted)" : "var(--color-text-muted)";
          const eventLabel = AUDIT_EVENT_LABELS[entry.event_type] || entry.event_type;
          const hasMeta = entry.metadata && Object.keys(entry.metadata).length > 0;
          const isMetaOpen = !!expandedMeta[entry.id];

          return (
            <div key={entry.id} className="relative group text-xs">
              {/* Square marker in status colour */}
              <span
                className="absolute -left-[24px] top-1 w-2.5 h-2.5 rounded-[2px] ring-2 ring-[var(--color-surface)]"
                style={{ backgroundColor: markerColor }}
              />

              <div className="space-y-1">
                {/* Header: Event Label + Actor + IST Timestamp */}
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {eventLabel}
                    </span>
                    {entry.actor_role && (
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        by {entry.actor_name || entry.actor_role}
                      </span>
                    )}
                  </div>
                  <time className="font-mono text-[11px] text-[var(--color-text-muted)] tabular-nums">
                    {formatIST(entry.timestamp)}
                  </time>
                </div>

                {/* State transition info if present */}
                {(entry.previous_state || entry.new_state) && (
                  <div className="text-[11px] text-[var(--color-text-secondary)]">
                    {entry.previous_state && <span>{entry.previous_state} → </span>}
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {entry.new_state}
                    </span>
                  </div>
                )}

                {/* Remark / Reason text */}
                {entry.remark && (
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {entry.remark}
                  </p>
                )}

                {/* Optional Metadata details */}
                {hasMeta && (
                  <div className="pt-0.5">
                    <button
                      onClick={() => toggleMeta(entry.id)}
                      className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-0.5"
                    >
                      {isMetaOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <span>{isMetaOpen ? "Hide metadata" : "View metadata"}</span>
                    </button>
                    {isMetaOpen && (
                      <pre className="mt-1 p-2 bg-[var(--color-page)] border border-[var(--color-rule)] rounded-[4px] font-mono text-[10px] text-[var(--color-text-secondary)] overflow-x-auto">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
