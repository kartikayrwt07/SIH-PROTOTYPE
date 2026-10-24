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
                    ? "bg-ink border border-ink"
                    : isCurrentAction
                    ? "bg-action border border-action"
                    : "bg-transparent border border-rule",
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
        <span className="text-xs text-text-secondary font-medium truncate max-w-[140px]">
          {status}
        </span>
      </div>
    );
  }

  // Full variant (dossier header)
  return (
    <div className={cn("w-full space-y-2 pt-1", className)}>
      {/* 9 Stage Segments Bar */}
      <div className="relative">
        <div className="grid grid-cols-9 gap-1.5">
          {ALL_STATUSES.map((stage, idx) => {
            const isFilledInk = isComplete || idx < currentIndex;
            const isCurrentAction = !isComplete && idx === currentIndex;

            return (
              <div key={stage} className="flex flex-col gap-1.5">
                <div
                  className={cn(
                    "h-2 w-full rounded-[2px]",
                    isFilledInk
                      ? "bg-ink border border-ink"
                      : isCurrentAction
                      ? "bg-action border border-action"
                      : "bg-transparent border border-rule",
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
                      ? "text-ink font-semibold"
                      : isFilledInk
                      ? "text-text-primary font-medium"
                      : "text-text-muted",
                  )}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        {/* SLA Timeline Marker (hidden when Resolved or Closed) */}
        {!isComplete && dueDate && (
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-rule text-text-secondary">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isOverdue ? "bg-sla-overdue" : "bg-sla-ontrack",
                )}
              />
              <span className="font-medium">
                {isOverdue ? (
                  <span className="text-sla-overdue">SLA target exceeded</span>
                ) : (
                  <span>Within SLA resolution window</span>
                )}
              </span>
            </div>
            {slaPercentage !== null && (
              <span className="tabular-nums text-text-muted text-[11px]">
                {slaPercentage}% of elapsed SLA time used
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
