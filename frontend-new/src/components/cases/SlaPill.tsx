import React from "react";
import type { SlaStatus } from "@/types/ui";
import { cn } from "@/lib/utils";

interface SlaPillProps {
  status?: SlaStatus;
  dueDate?: string | null;
  hoursRemaining?: number | null;
  className?: string;
  isResolved?: boolean;
}

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
  let status = explicitStatus;
  let hours = explicitHours;

  if (!status) {
    const derived = deriveSlaStatus(dueDate, isResolved);
    status = derived.status;
    hours = derived.hoursRemaining;
  }

  if (isResolved) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap",
          className,
        )}
      >
        Completed
      </span>
    );
  }

  let colorClasses = "bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]"; // On Track
  let label = "On Track";

  if (status === "OVERDUE") {
    colorClasses = "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";
    label = "Overdue";
  } else if (status === "APPROACHING") {
    colorClasses = "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]";
    label = "Approaching";
  }

  const timeText = formatRemainingTime(hours);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border tabular-nums whitespace-nowrap",
        colorClasses,
        className,
      )}
      title={dueDate ? `Due date: ${new Date(dueDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` : undefined}
    >
      <span>{label}</span>
      {hours !== null && hours !== undefined && (
        <>
          <span className="opacity-50">·</span>
          <span>{timeText}</span>
        </>
      )}
    </span>
  );
}
