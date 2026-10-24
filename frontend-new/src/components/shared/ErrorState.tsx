import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: Error | string | null | undefined;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  const errorMessage =
    typeof error === "string"
      ? error
      : error?.message || "Failed to load requested data.";

  return (
    <div
      className={cn(
        "py-8 px-6 text-center max-w-md mx-auto space-y-2 border border-rule bg-surface rounded",
        className,
      )}
      role="alert"
    >
      <p className="font-medium text-sla-overdue text-sm">{errorMessage}</p>
      <p className="text-xs text-text-secondary leading-normal">
        Check your network connection or permissions and retry the operation.
      </p>
      {onRetry && (
        <div className="pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="text-xs h-8 border-rule text-ink hover:bg-page"
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
