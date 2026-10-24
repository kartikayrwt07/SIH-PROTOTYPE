import React from "react";
import type { CasePriority } from "@/types/ui";
import { cn } from "@/lib/utils";

interface PriorityMarkProps {
  priority: CasePriority;
  className?: string;
  showBars?: boolean;
}

const BARS_COUNT: Record<CasePriority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
};

export function PriorityMark({ priority, className, showBars = true }: PriorityMarkProps) {
  const bars = BARS_COUNT[priority] ?? 2;
  const isUrgent = priority === "URGENT";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap",
        isUrgent ? "text-sla-overdue" : "text-text-secondary",
        className,
      )}
    >
      {showBars && (
        <span className="flex items-end gap-0.5 h-3 w-2.5" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => {
            const isFilled = i <= bars;
            return (
              <span
                key={i}
                className={cn(
                  "w-[2px] rounded-[0.5px] transition-colors",
                  isFilled
                    ? isUrgent
                      ? "bg-sla-overdue"
                      : "bg-ink"
                    : "bg-rule",
                )}
                style={{ height: `${i * 25}%` }}
              />
            );
          })}
        </span>
      )}
      <span>{priority}</span>
    </span>
  );
}
