import React from "react";
import type { SlaStatus } from "@/types/ui";
import { cn } from "@/lib/utils";

export interface SlaPillProps {
  status?: SlaStatus;
  dueDate?: string | null;
  hoursRemaining?: number | null;
  className?: string;
  isResolved?: boolean;
}

/** Formatter preserved for test assertions */
export function formatRemainingTime(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return "N/A";
  const absHours = Math.abs(hours);
  if (hours < 0) {
    if (absHours >= 24) {
      const days = Math.floor(absHours / 24);
      const remHours = Math.round(absHours % 24);
      return remHours > 0 ? `${days}d ${remHours}h overdue` : `${days}d overdue`;
    }
    return `${Math.round(absHours)}h overdue`;
  }
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = Math.round(hours % 24);
    return remHours > 0 ? `${days}d ${remHours}h left` : `${days}d left`;
  }
  return `${Math.max(1, Math.round(hours))}h left`;
}

/** Formatter for SlaPill component presentation ("Overdue by 6 h", "Due in 31 h", "On track", "Completed", "No deadline") */
export function formatSlaPillLabel(
  status: SlaStatus,
  hours: number | null | undefined,
  isResolved = false,
  hasDueDate = true,
): string {
  if (isResolved) return "Completed";
  if (!hasDueDate && (hours === null || hours === undefined)) return "No deadline";
  if (hours === null || hours === undefined) return "On track";

  const absHours = Math.abs(hours);
  if (hours < 0) {
    if (absHours >= 24) {
      const days = Math.floor(absHours / 24);
      const rem = Math.round(absHours % 24);
      return rem > 0 ? `Overdue by ${days} d ${rem} h` : `Overdue by ${days} d`;
    }
    return `Overdue by ${Math.max(1, Math.round(absHours))} h`;
  }
  if (status === "APPROACHING" || hours <= 48) {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const rem = Math.round(hours % 24);
      return rem > 0 ? `Due in ${days} d ${rem} h` : `Due in ${days} d`;
    }
    return `Due in ${Math.max(1, Math.round(hours))} h`;
  }
  return "On track";
}

export function deriveSlaStatus(dueDate: string | null | undefined, isResolved = false): {
  status: SlaStatus;
  hoursRemaining: number | null;
} {
  if (isResolved || !dueDate) {
    return { status: "ON_TRACK", hoursRemaining: null };
  }
  const now = Date.now();
  const due = new Date(dueDate).getTime();
  if (isNaN(due)) {
    return { status: "ON_TRACK", hoursRemaining: null };
  }
  const diffHours = (due - now) / (1000 * 60 * 60);
  if (diffHours < 0) {
    return { status: "OVERDUE", hoursRemaining: diffHours };
  }
  if (diffHours <= 48) {
    return { status: "APPROACHING", hoursRemaining: diffHours };
  }
  return { status: "ON_TRACK", hoursRemaining: diffHours };
}

export function SlaPill({
  status: explicitStatus,
  dueDate,
  hoursRemaining: explicitHours,
  className,
  isResolved = false,
}: SlaPillProps) {
  if (isResolved) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums whitespace-nowrap bg-sla-completed-bg text-sla-completed",
          className,
        )}
      >
        Completed
      </span>
    );
  }

  let status = explicitStatus;
  let hours = explicitHours;

  if (!status) {
    const derived = deriveSlaStatus(dueDate, isResolved);
    status = derived.status;
    hours = derived.hoursRemaining;
  }

  const hasDueDate = !!dueDate;
  if (!hasDueDate && (hours === null || hours === undefined)) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums whitespace-nowrap bg-sla-completed-bg text-sla-completed",
          className,
        )}
      >
        No deadline
      </span>
    );
  }

  let styleClasses = "bg-sla-ontrack-bg text-sla-ontrack";
  if (status === "OVERDUE") {
    styleClasses = "bg-sla-overdue-bg text-sla-overdue";
  } else if (status === "APPROACHING") {
    styleClasses = "bg-sla-approaching-bg text-sla-approaching";
  }

  const label = formatSlaPillLabel(status ?? "ON_TRACK", hours, isResolved, hasDueDate);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums whitespace-nowrap",
        styleClasses,
        className,
      )}
    >
      {label}
    </span>
  );
}
