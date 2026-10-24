import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  dueDate: string | null;
  className?: string;
}

export function CountdownTimer({ dueDate, className }: CountdownTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Live update every minute (60,000 ms) as specified in SPEC
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!dueDate) {
    return <span className="text-muted-foreground text-xs">No target due date</span>;
  }

  const dueTime = new Date(dueDate).getTime();
  const diffMs = dueTime - now;

  if (diffMs <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 tabular-nums">
        <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse shrink-0" />
        Breached
      </span>
    );
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  const formatted =
    days > 0
      ? `${days}d ${remHours}h ${minutes}m`
      : `${hours}h ${minutes}m`;

  // Color coding: under 12h is high alert, 12-48h is warning
  const isUrgent = hours < 12;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tabular-nums border",
        isUrgent
          ? "bg-amber-100/80 border-amber-300 text-amber-900 font-semibold"
          : "bg-amber-50 border-amber-200 text-amber-800",
        className,
      )}
      title={`Target due date: ${new Date(dueDate).toLocaleString("en-IN")}`}
    >
      <Clock className={cn("h-3 w-3 shrink-0", isUrgent ? "text-amber-700 animate-pulse" : "text-amber-600")} />
      <span>{formatted} remaining</span>
    </div>
  );
}
