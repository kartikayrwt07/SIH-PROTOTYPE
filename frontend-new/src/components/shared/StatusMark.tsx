import React from "react";
import type { CaseStatus } from "@/types/ui";
import { cn } from "@/lib/utils";

const STATUS_SQUARE_COLORS: Record<CaseStatus, string> = {
  Received: "#727B8E",
  Registered: "#4972A8",
  "Under Triage": "#7A57C1",
  Assigned: "#368199",
  "In Progress": "#7052C8",
  "Awaiting Information": "#9E6E1D",
  "Under Review": "#974E79",
  Resolved: "#257D4E",
  Closed: "#625A70",
  Rejected: "#DC2626",
};

interface StatusMarkProps {
  status: CaseStatus;
  className?: string;
}

export function StatusMark({ status, className }: StatusMarkProps) {
  const squareColor = STATUS_SQUARE_COLORS[status] ?? "#727B8E";

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
