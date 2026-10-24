import React, { useState } from "react";
import type { CaseStatus } from "@/types/ui";
import {
  ALL_STATUSES,
  ALLOWED_TRANSITIONS,
  TRANSITION_GUARD_RULES,
  canTransition,
  getAllowedTransitions,
} from "@/lib/stateMachine";
import { PageHeader, StatusMark } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export function StateMachineView() {
  const [fromStatus, setFromStatus] = useState<CaseStatus>("Received");
  const [toStatus, setToStatus] = useState<CaseStatus>("In Progress");
  const [checkedResult, setCheckedResult] = useState<{
    isLegal: boolean;
    from: CaseStatus;
    to: CaseStatus;
    message: string;
    rules: string[];
  } | null>(null);

  const handleCheckTransition = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const isLegal = canTransition(fromStatus, toStatus);
    const allowed = getAllowedTransitions(fromStatus);
    const rules = TRANSITION_GUARD_RULES[toStatus] || [];

    if (isLegal) {
      setCheckedResult({
        isLegal: true,
        from: fromStatus,
        to: toStatus,
        message: `Permitted transition: '${fromStatus}' to '${toStatus}' complies with AICTE statutory state machine guards.`,
        rules,
      });
    } else {
      setCheckedResult({
        isLegal: false,
        from: fromStatus,
        to: toStatus,
        message: `Transition blocked: cannot move directly from '${fromStatus}' to '${toStatus}'. Allowed next stages: [${
          allowed.length > 0 ? allowed.join(", ") : "None (Terminal State)"
        }].`,
        rules,
      });
    }
  };

  const handleTryItAnyway = () => {
    toast.error(`Transition blocked: cannot move directly from ${fromStatus} to ${toStatus}`);
  };

  return (
    <div className="py-6 px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="State machine"
        description="The 9 complaint lifecycle stages and permitted transitions."
      />

      {/* Visual State Map: ruled sequence of stages with permitted transition arrows */}
      <section className="space-y-4">
        <div className="border-b border-[var(--color-rule)] pb-2">
          <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">
            Lifecycle stage topology
          </h2>
        </div>

        <div className="p-5 bg-surface border border-[var(--color-rule)] rounded-[4px] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-3">
            {ALL_STATUSES.map((status, index) => {
              const allowed = ALLOWED_TRANSITIONS[status] || [];
              const isSelectedFrom = fromStatus === status;
              const isSelectedTo = toStatus === status;

              return (
                <div
                  key={status}
                  onClick={() => setFromStatus(status)}
                  className={`p-3 border rounded-[4px] cursor-pointer space-y-2 transition-none ${
                    isSelectedFrom
                      ? "border-[var(--color-ink)] bg-[var(--color-page)] ring-1 ring-[var(--color-ink)]"
                      : isSelectedTo
                      ? "border-[var(--color-action)] bg-[var(--color-page)]"
                      : "border-[var(--color-rule)] bg-surface hover:bg-[var(--color-page)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                      0{index + 1}
                    </span>
                    {status === "Closed" && (
                      <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
                        Terminal
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <StatusMark status={status} />
                  </div>

                  <div className="pt-1 border-t border-[var(--color-rule)] text-[10px] text-[var(--color-text-muted)]">
                    {allowed.length > 0 ? (
                      <div>→ {allowed.join(", ")}</div>
                    ) : (
                      <div>No further transitions</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-rule)]">
            <span>Click any stage card to select it as the source stage.</span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Special transitions: In Progress ⇄ Awaiting Information · Resolved → In Progress (Reopen)
            </span>
          </div>
        </div>
      </section>

      {/* "Test an illegal transition" Panel */}
      <section className="space-y-4 max-w-2xl">
        <div className="border-b border-[var(--color-rule)] pb-2">
          <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">
            Test an illegal transition
          </h2>
        </div>

        <form onSubmit={handleCheckTransition} className="p-5 bg-surface border border-[var(--color-rule)] rounded-[4px] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* From status select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--color-text-primary)]">
                From status
              </Label>
              <Select
                value={fromStatus}
                onValueChange={(val) => {
                  setFromStatus(val as CaseStatus);
                  setCheckedResult(null);
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((st) => (
                    <SelectItem key={st} value={st} className="text-xs">
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To status select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--color-text-primary)]">
                To status
              </Label>
              <Select
                value={toStatus}
                onValueChange={(val) => {
                  setToStatus(val as CaseStatus);
                  setCheckedResult(null);
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((st) => (
                    <SelectItem key={st} value={st} className="text-xs">
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              className="h-8 px-4 text-xs font-medium bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 rounded-[6px]"
            >
              Check transition
            </Button>
          </div>

          {/* Validation Result Alert */}
          {checkedResult && (
            <div className="space-y-3 pt-2">
              {checkedResult.isLegal ? (
                /* Legal green alert */
                <div className="p-3.5 bg-[var(--sla-on-track-bg)] border border-[var(--sla-on-track-text)]/30 rounded-[4px] text-xs text-[var(--sla-on-track-text)] space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Permitted transition</span>
                  </div>
                  <p className="text-[var(--color-text-primary)] leading-relaxed">
                    {checkedResult.message}
                  </p>
                  {checkedResult.rules.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[var(--sla-on-track-text)]/20 text-[11px] text-[var(--color-text-secondary)]">
                      <span className="font-medium text-[var(--color-text-primary)] block">Condition rules:</span>
                      {checkedResult.rules.map((rule, idx) => (
                        <div key={idx}>• {rule}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Illegal red alert */
                <div className="p-3.5 bg-[var(--sla-overdue-bg)] border border-[var(--sla-overdue-text)]/30 rounded-[4px] text-xs text-[var(--sla-overdue-text)] space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Transition blocked</span>
                  </div>
                  <p className="text-[var(--color-text-primary)] leading-relaxed">
                    {checkedResult.message}
                  </p>

                  <div className="pt-1 border-t border-[var(--sla-overdue-text)]/20 flex items-center justify-between">
                    <span className="text-[11px] text-[var(--color-text-secondary)]">
                      Simulate backend HTTP 400 enforcement:
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTryItAnyway}
                      className="h-7 text-xs border-[var(--sla-overdue-text)]/40 text-[var(--sla-overdue-text)] hover:bg-[var(--sla-overdue-bg)] rounded-[6px]"
                    >
                      Try it anyway
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
