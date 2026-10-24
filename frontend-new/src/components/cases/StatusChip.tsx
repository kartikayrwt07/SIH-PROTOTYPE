import React from "react";
import type { CaseStatus } from "@/types/ui";
import { cn } from "@/lib/utils";

// Fresh & Soothing Case Register Tokens:
const STATUS_DOT_COLORS: Record<CaseStatus, string> = {
  Received: "bg-[#727B8E]",
  Registered: "bg-[#4972A8]",
  "Under Triage": "bg-[#7A57C1]",
  Assigned: "bg-[#368199]",
  "In Progress": "bg-[#7052C8]",
  "Awaiting Information": "bg-[#9E6E1D]",
  "Under Review": "bg-[#974E79]",
  Resolved: "bg-[#257D4E]",
  Closed: "bg-[#625A70]",
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
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/30 border border-border/60 text-foreground whitespace-nowrap",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotColor)} />
      <span>{status}</span>
    </span>
  );
}
