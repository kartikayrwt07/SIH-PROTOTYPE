import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-rule",
        className,
      )}
    >
      <div className="space-y-1 max-w-3xl">
        <h1 className="font-serif text-2xl font-semibold text-ink tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-text-secondary leading-normal">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0 self-start sm:self-auto flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
