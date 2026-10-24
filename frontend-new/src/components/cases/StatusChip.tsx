import React from "react";
import type { CaseStatus } from "@/types/ui";
import { cn } from "@/lib/utils";

// SPEC colors:
// Received #64748B, Registered #3B82F6, Under Triage #8B5CF6, Assigned #06B6D4,
// In Progress #0284C7, Awaiting Information #EAB308, Under Review #EC4899,
// Resolved #10B981, Closed #475569.
const STATUS_DOT_COLORS: Record<CaseStatus, string> = {
  Received: "bg-[#64748B]",
  Registered: "bg-[#3B82F6]",
  "Under Triage": "bg-[#8B5CF6]",
  Assigned: "bg-[#06B6D4]",
  "In Progress": "bg-[#0284C7]",
  "Awaiting Information": "bg-[#EAB308]",
  "Under Review": "bg-[#EC4899]",
  Resolved: "bg-[#10B981]",
  Closed: "bg-[#475569]",
};

interface StatusChipProps {
  status: CaseStatus;
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  const dotColor = STATUS_DOT_COLORS[status] ?? "bg-slate-400";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-card border border-border text-foreground shadow-2xs whitespace-nowrap",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotColor)} />
      <span>{status}</span>
    </span>
  );
}
