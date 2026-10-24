import React from "react";
import type { CaseStatus } from "@/types/ui";
import { cn } from "@/lib/utils";

const STATUS_SQUARE_COLORS: Record<CaseStatus, string> = {
  Received: "#64748B",
  Registered: "#3B82F6",
  "Under Triage": "#8B5CF6",
  Assigned: "#06B6D4",
  "In Progress": "#0284C7",
  "Awaiting Information": "#EAB308",
  "Under Review": "#EC4899",
  Resolved: "#10B981",
  Closed: "#475569",
};

interface StatusMarkProps {
  status: CaseStatus;
  className?: string;
}

export function StatusMark({ status, className }: StatusMarkProps) {
  const squareColor = STATUS_SQUARE_COLORS[status] ?? "#64748B";

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-text-primary whitespace-nowrap", className)}>
      <span
        className="h-2 w-2 rounded-[2px] shrink-0 inline-block"
        style={{ backgroundColor: squareColor }}
        aria-hidden="true"
      />
      <span>{status}</span>
    </span>
  );
}
