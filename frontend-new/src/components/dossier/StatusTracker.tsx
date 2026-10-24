import React from "react";
import type { CaseStatus } from "@/types/ui";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";

interface StatusTrackerProps {
  currentStatus: CaseStatus;
  variant?: "banner" | "sidebar";
}

const STATUS_INDEX_MAP: Record<CaseStatus, number> = {
  Received: 0,
  Registered: 1,
  "Under Triage": 2,
  Assigned: 3,
  "In Progress": 4,
  "Awaiting Information": 4,
  "Under Review": 5,
  Resolved: 6,
  Closed: 7,
};

const DISPLAY_STAGES = [
  { label: "Received", step: 0, desc: "Grievance received in system" },
  { label: "Registered", step: 1, desc: "Assigned official AICTE reference ID" },
  { label: "Triage", step: 2, desc: "Classification & bureau assignment" },
  { label: "Assigned", step: 3, desc: "Assigned to desk officer" },
  { label: "In Progress", step: 4, desc: "Investigation & action underway" },
  { label: "Review", step: 5, desc: "Competent authority review" },
  { label: "Resolved", step: 6, desc: "Action taken & resolution finalized" },
  { label: "Closed", step: 7, desc: "Formally closed in register" },
];

export function StatusTracker({ currentStatus, variant = "banner" }: StatusTrackerProps) {
  const currentStep = STATUS_INDEX_MAP[currentStatus] ?? 0;
  const isAwaitingInfo = currentStatus === "Awaiting Information";
  const isTerminalClosed = currentStatus === "Closed";

  if (variant === "banner") {
    // Full-width banner layout for top of dossier (horizontal pipeline)
    return (
      <div className="bg-card rounded-lg border border-border/60 p-4 shadow-none space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground text-xs">
              Lifecycle
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground text-xs">
              Status: <strong className="text-foreground font-semibold">{currentStatus}</strong>
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Stage {Math.min(currentStep + 1, 8)} of 8
          </span>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="min-w-[640px] relative pt-1 pb-1">
            <div className="flex items-center justify-between relative z-10">
              {DISPLAY_STAGES.map((stage) => {
                const isCompleted = stage.step < currentStep || (stage.step === 7 && isTerminalClosed);
                const isCurrent = stage.step === currentStep && !(stage.step === 7 && !isTerminalClosed);

                return (
                  <div key={stage.label} className="flex flex-col items-center flex-1 text-center px-1">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium border transition-colors",
                        isCurrent
                          ? "bg-primary text-primary-foreground border-primary"
                          : isCompleted
                          ? "bg-muted text-foreground border-border/60"
                          : "bg-background text-muted-foreground/60 border-border/60",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3 stroke-[2.5]" />
                      ) : (
                        <span>{stage.step + 1}</span>
                      )}
                    </div>

                    <span
                      className={cn(
                        "text-[11px] mt-1.5 whitespace-nowrap",
                        isCurrent
                          ? "font-semibold text-foreground"
                          : isCompleted
                          ? "font-medium text-muted-foreground"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="absolute top-[17px] left-[6%] right-[6%] h-[1px] bg-border/60 -z-0" />
          </div>
        </div>
      </div>
    );
  }

  // Sidebar variant: Clean vertical timeline stepper.
  return (
    <div className="bg-card rounded-lg border border-border/60 p-4 shadow-none space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground">
          Lifecycle Progression
        </h4>
        <span className="text-[11px] text-muted-foreground">
          Stage {Math.min(currentStep + 1, 8)}/8
        </span>
      </div>

      {isAwaitingInfo && (
        <div className="px-2.5 py-1.5 text-[11px] rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 font-medium">
          ⚠️ Case in <strong>Awaiting Information</strong> (waiting for complainant response).
        </div>
      )}

      {/* Vertical Step Progression */}
      <div className="relative pt-1 pl-1">
        <div className="space-y-3">
          {DISPLAY_STAGES.map((stage, idx) => {
            const isCompleted = stage.step < currentStep || (stage.step === 7 && isTerminalClosed);
            const isCurrent = stage.step === currentStep && !(stage.step === 7 && !isTerminalClosed);
            const isLast = idx === DISPLAY_STAGES.length - 1;

            return (
              <div key={stage.label} className="relative flex items-start gap-3 group">
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-[11px] top-[24px] bottom-[-12px] w-[2px]",
                      isCompleted ? "bg-green-600" : "bg-border",
                    )}
                  />
                )}

                {/* Step Circle Indicator */}
                <div
                  className={cn(
                    "relative z-10 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors shrink-0",
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary ring-3 ring-primary/20 shadow-xs"
                      : isCompleted
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-background text-muted-foreground border-border",
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : isCurrent ? (
                    <Circle className="h-2 w-2 fill-current" />
                  ) : (
                    <span>{stage.step + 1}</span>
                  )}
                </div>

                {/* Stage Label and Status */}
                <div className="flex-1 min-w-0 flex items-center justify-between pt-0.5">
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-xs leading-none font-medium",
                        isCurrent
                          ? "font-bold text-foreground text-[13px]"
                          : isCompleted
                          ? "text-foreground font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      {stage.label}
                    </span>
                  </div>

                  {isCurrent && (
                    <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Current
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] text-green-700 dark:text-emerald-400 font-medium">Done</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
