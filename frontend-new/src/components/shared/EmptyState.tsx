import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  message: string;
  instruction: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  message,
  instruction,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "py-12 px-6 text-center max-w-md mx-auto space-y-2",
        className,
      )}
    >
      <p className="font-medium text-ink text-sm">{message}</p>
      <p className="text-xs text-text-secondary leading-normal">{instruction}</p>
      {actionText && onAction && (
        <div className="pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onAction}
            className="text-xs h-8 border-rule text-ink hover:bg-page"
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
