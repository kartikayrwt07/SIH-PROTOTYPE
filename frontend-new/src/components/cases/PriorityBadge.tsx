import React from "react";
import type { CasePriority } from "@/types/ui";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
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

export function PriorityBadge({ priority, className, showBars = true }: PriorityBadgeProps) {
  const bars = BARS_COUNT[priority] ?? 2;
  const isUrgent = priority === "URGENT";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap",
        isUrgent ? "text-red-600 font-semibold" : "text-muted-foreground",
        className,
      )}
    >
      {showBars && (
        <span className="flex items-end gap-0.5 h-3.5 w-3" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => {
            const isFilled = i <= bars;
            return (
              <span
                key={i}
                className={cn(
                  "w-0.5 rounded-full transition-colors",
                  isFilled
                    ? isUrgent
                      ? "bg-red-600"
                      : "bg-foreground/70"
                    : "bg-muted-foreground/20",
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
