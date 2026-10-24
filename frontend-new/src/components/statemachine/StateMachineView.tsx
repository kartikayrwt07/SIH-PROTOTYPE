import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCases } from "@/api/index";
import type { CaseStatus } from "@/types/ui";
import {
  ALL_STATUSES,
  ALLOWED_TRANSITIONS,
  TRANSITION_GUARD_RULES,
  canTransition,
  getAllowedTransitions,
} from "@/lib/stateMachine";
import { PageHeader } from "@/components/shared";
import { StateGraph } from "./StateGraph";
import { StateDetailsPanel } from "./StateDetailsPanel";
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
import { CheckCircle2, AlertCircle } from "lucide-react";

export function StateMachineView() {
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus>("In Progress");
  const [fromStatus, setFromStatus] = useState<CaseStatus>("Received");
  const [toStatus, setToStatus] = useState<CaseStatus>("In Progress");
  const [checkedResult, setCheckedResult] = useState<{
    isLegal: boolean;
    from: CaseStatus;
    to: CaseStatus;
    message: string;
    rules: string[];
  } | null>(null);

  // Query cases to calculate live distribution across the 9 states
  const { data: casesData } = useQuery({
    queryKey: ["cases", { page: 1, limit: 100 }],
    queryFn: () => listCases({ page_size: 100 }),
    staleTime: 60 * 1000,
  });

  const cases = casesData?.items ?? [];

  const caseCountsByStatus = cases.reduce<Record<CaseStatus, number>>(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<CaseStatus, number>,
  );

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
    <div className="py-10 px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      <PageHeader
        title="State machine"
        description="The 9 complaint lifecycle stages and permitted transitions."
      />

      {/* Main 2-Column Layout: Visual Interactive Diagram & State Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Visual Graph Canvas (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <StateGraph
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            caseCountsByStatus={caseCountsByStatus}
          />
        </div>

        {/* State Details & Guard Rules Side Panel (1 col, sticky) */}
        <div className="lg:col-span-1 lg:sticky lg:top-8">
          <StateDetailsPanel
            status={selectedStatus}
            onSelectStatus={setSelectedStatus}
            caseCount={caseCountsByStatus[selectedStatus] ?? 0}
          />
        </div>
      </div>

      {/* "Test an illegal transition" Panel */}
      <section className="space-y-4 max-w-3xl pt-2">
        <div className="border-b border-[var(--color-rule)] pb-2.5">
          <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">
            Test an illegal transition
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Verify lifecycle guard rule validation by testing arbitrary stage transitions.
          </p>
        </div>

        <form onSubmit={handleCheckTransition} className="p-6 bg-surface border border-[var(--color-rule)] rounded-[6px] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                <div className="p-4 bg-[var(--sla-ontrack-bg)] dark:bg-[#102B1D]/50 border border-[var(--sla-ontrack-text)]/30 dark:border-[#34D399]/35 rounded-[6px] text-xs text-[var(--sla-ontrack-text)] dark:text-[#34D399] space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Permitted transition</span>
                  </div>
                  <p className="text-[var(--color-text-primary)] leading-relaxed">
                    {checkedResult.message}
                  </p>
                  {checkedResult.rules.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-[var(--sla-ontrack-text)]/20 text-[11px] text-[var(--color-text-secondary)]">
                      <span className="font-medium text-[var(--color-text-primary)] block">Condition rules:</span>
                      {checkedResult.rules.map((rule, idx) => (
                        <div key={idx}>• {rule}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Illegal red alert */
                <div className="p-4 bg-[var(--sla-overdue-bg)] dark:bg-[#2B1015]/50 border border-[var(--sla-overdue-text)]/30 dark:border-[#F87171]/35 rounded-[6px] text-xs text-[var(--sla-overdue-text)] dark:text-[#F87171] space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Transition blocked</span>
                  </div>
                  <p className="text-[var(--color-text-primary)] leading-relaxed">
                    {checkedResult.message}
                  </p>

                  <div className="pt-2 border-t border-[var(--sla-overdue-text)]/20 flex items-center justify-between">
                    <span className="text-[11px] text-[var(--color-text-secondary)]">
                      Simulate backend HTTP 400 enforcement:
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTryItAnyway}
                      className="h-7 text-xs border-[var(--sla-overdue-text)]/40 dark:border-[#F87171]/40 text-[var(--sla-overdue-text)] dark:text-[#F87171] hover:bg-[var(--sla-overdue-bg)] dark:hover:bg-rose-950/30 rounded-[6px]"
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
