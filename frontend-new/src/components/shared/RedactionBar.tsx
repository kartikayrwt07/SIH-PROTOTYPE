import React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RedactionBarProps {
  className?: string;
  lines?: number;
}

export function RedactionBar({ className, lines = 3 }: RedactionBarProps) {
  return (
    <div
      className={cn(
        "border border-rule bg-page p-4 rounded space-y-3 select-none",
        className,
      )}
      role="region"
      aria-label="Redacted confidential content"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
        <Lock className="h-3.5 w-3.5 text-ink shrink-0" aria-hidden="true" />
        <span>Confidential statement redacted under the data governance policy</span>
      </div>

      <div className="space-y-2 pt-1" aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 bg-ink rounded-[1px]",
              i === lines - 1 ? "w-2/3" : "w-full",
            )}
          />
        ))}
      </div>
    </div>
  );
}
