import React from "react";
import type { CaseStatus } from "@/types/ui";
import { ALL_STATUSES } from "@/lib/stateMachine";
import { cn } from "@/lib/utils";

interface LifecycleStripProps {
  status: CaseStatus;
  variant?: "compact" | "full";
  dueDate?: string | null;
  createdAt?: string | null;
  className?: string;
}

export function LifecycleStrip({
  status,
  variant = "compact",
  dueDate,
  createdAt,
  className,
}: LifecycleStripProps) {
  const isComplete = status === "Resolved" || status === "Closed";
  const currentIndex = ALL_STATUSES.indexOf(status);

  // SLA calculations for full variant
  const isOverdue = dueDate ? new Date(dueDate).getTime() < Date.now() : false;

  let slaPercentage: number | null = null;
  if (!isComplete && dueDate && createdAt) {
    const start = new Date(createdAt).getTime();
    const end = new Date(dueDate).getTime();
    const now = Date.now();
    if (end > start) {
      slaPercentage = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
    }
  }

  if (variant === "compact") {
    return (
      <div
        className={cn("inline-flex items-center gap-2", className)}
        role="group"
        aria-label={`Lifecycle stage: ${status}`}
      >
        <div className="flex items-center gap-1">
          {ALL_STATUSES.map((stage, idx) => {
            const isFilledInk = isComplete || idx < currentIndex;
            const isCurrentAction = !isComplete && idx === currentIndex;

            return (
              <div
                key={stage}
                className={cn(
                  "h-1.5 w-2.5 rounded-[1px] transition-colors",
                  isFilledInk
                    ? "bg-[var(--color-ink)]"
                    : isCurrentAction
                    ? "bg-[var(--color-action)] shadow-xs"
                    : "bg-[var(--color-rule)]/70",
                )}
                role="img"
                aria-label={`Stage ${idx + 1}: ${stage} (${
                  isCurrentAction ? "Current" : isFilledInk ? "Completed" : "Pending"
                })`}
                title={`${idx + 1}. ${stage}`}
              />
            );
          })}
        </div>
        <span className="text-xs text-[var(--color-text-secondary)] font-medium truncate max-w-[140px]">
          {status}
        </span>
      </div>
    );
  }

  // Full variant (dossier header)
  return (
    <div className={cn("w-full space-y-3 pt-1", className)}>
      {/* 9 Stage Segments Bar */}
      <div className="relative">
        <div className="grid grid-cols-9 gap-2">
          {ALL_STATUSES.map((stage, idx) => {
            const isFilledInk = isComplete || idx < currentIndex;
            const isCurrentAction = !isComplete && idx === currentIndex;

            return (
              <div key={stage} className="flex flex-col gap-1.5">
                <div
                  className={cn(
                    "h-2 w-full rounded-[2px] transition-all",
                    isFilledInk
                      ? "bg-[var(--color-ink)]"
                      : isCurrentAction
                      ? "bg-[var(--color-action)] shadow-xs ring-2 ring-[var(--color-action)]/25"
                      : "bg-[var(--color-rule)]/50 border border-[var(--color-rule)]",
                  )}
                  role="img"
                  aria-label={`Stage ${idx + 1}: ${stage} (${
                    isCurrentAction ? "Current" : isFilledInk ? "Completed" : "Pending"
                  })`}
                />
                <span
                  className={cn(
                    "text-[11px] leading-tight line-clamp-2",
                    isCurrentAction
                      ? "text-[var(--color-action)] font-bold"
                      : isFilledInk
                      ? "text-[var(--color-ink)] font-semibold"
                      : "text-[var(--color-text-muted)]",
                  )}
                >
                  <span className="font-mono text-[9px] mr-1 opacity-70">{idx + 1}.</span>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        {/* SLA Timeline Marker (hidden when Resolved or Closed) */}
        {!isComplete && dueDate && (
          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-[var(--color-rule)] text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isOverdue ? "bg-[var(--sla-overdue-text)]" : "bg-[#1E7B52]",
                )}
              />
              <span className="font-medium">
                {isOverdue ? (
                  <span className="text-[var(--sla-overdue-text)] font-semibold">SLA resolution deadline exceeded</span>
                ) : (
                  <span className="text-[#1E7B52] font-medium">Within statutory SLA resolution window</span>
                )}
              </span>
            </div>
            {slaPercentage !== null && (
              <span className="tabular-nums font-mono text-[var(--color-text-muted)] text-[11px]">
                {slaPercentage}% of elapsed SLA time used
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
