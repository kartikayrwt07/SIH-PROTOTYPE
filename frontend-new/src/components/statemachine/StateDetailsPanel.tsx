import React from "react";
import type { CaseStatus } from "@/types/ui";
import {
  ALLOWED_TRANSITIONS,
  TRANSITION_GUARD_RULES,
  isTerminal,
  isActive,
} from "@/lib/stateMachine";
import { StatusMark } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";

interface StateDetailsPanelProps {
  status: CaseStatus;
  onSelectStatus: (status: CaseStatus) => void;
  caseCount?: number;
}

const EXTENDED_STATUS_DESCRIPTIONS: Record<CaseStatus, string> = {
  Received:
    "Initial grievance intake received through portal or bulk CSV ingestion. Complaint text is logged and awaiting formal registration into the AICTE case repository.",
  Registered:
    "Assigned an official permanent AICTE Case Reference ID (AICTE-2026-XXXXX). Acknowledgment receipt generated for complainant.",
  "Under Triage":
    "Reviewed by the classification desk. Categorized into jurisdictional bureau (APPR, STU, FDC, FIN), category, and normative SLA priority.",
  Assigned:
    "Jurisdiction confirmed and assigned to a designated desk officer within the responsible bureau for procedural investigation.",
  "In Progress":
    "Desk officer is actively reviewing institutional evidence, conducting document verification, and communicating with college authorities.",
  "Awaiting Information":
    "Formal inquiry or documentary clarification notice issued to complainant or institution. SLA clock paused/tracked pending response.",
  "Under Review":
    "Investigation findings and draft recommendation submitted to the Competent Supervisory Authority for executive review.",
  Resolved:
    "Formal administrative resolution order issued. Prescribed remedies, warnings, or compliance directives communicated to the institution.",
  Closed:
    "Case formally concluded and sealed in the AICTE grievance ledger. Immutable terminal state with permanent audit trail.",
};

export function StateDetailsPanel({
  status,
  onSelectStatus,
  caseCount = 0,
}: StateDetailsPanelProps) {
  const allowedNext = ALLOWED_TRANSITIONS[status] ?? [];
  const guardRules = TRANSITION_GUARD_RULES[status] ?? [];
  const terminal = isTerminal(status);
  const active = isActive(status);

  return (
    <div className="bg-surface border border-[var(--color-rule)] rounded-[6px] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-[var(--color-rule)] pb-3">
        <span className="font-serif text-sm font-semibold text-[var(--color-ink)]">
          Stage inspector
        </span>
        <StatusMark status={status} />
      </div>

      {/* Description */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--color-text-primary)] text-sm">{status}</span>
          {terminal ? (
            <span className="text-[10px] text-[var(--color-text-muted)] border border-[var(--color-rule)] px-1.5 py-0.5 rounded">
              Terminal
            </span>
          ) : active ? (
            <span className="text-[10px] text-[var(--color-action)] font-semibold bg-[var(--color-page)] px-2 py-0.5 rounded border border-[var(--color-rule)]">
              Active Stage
            </span>
          ) : (
            <span className="text-[10px] text-[var(--sla-ontrack-text)] font-semibold bg-[var(--sla-ontrack-bg)] px-2 py-0.5 rounded">
              Determined
            </span>
          )}
        </div>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {EXTENDED_STATUS_DESCRIPTIONS[status]}
        </p>
      </div>

      {/* Case Count row */}
      <div className="py-2.5 px-3 bg-[var(--color-page)] border border-[var(--color-rule)] rounded-[4px] flex items-center justify-between text-xs">
        <span className="text-[var(--color-text-muted)]">Cases in register:</span>
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-[var(--color-text-primary)] tabular-nums">
            {caseCount}
          </span>
          <Button asChild size="sm" variant="ghost" className="h-6 text-[11px] px-1.5 text-[var(--color-action)] hover:underline">
            <Link to="/cases" search={{ status }}>
              View
            </Link>
          </Button>
        </div>
      </div>

      {/* Allowed Transitions */}
      <div className="space-y-3 pt-1 border-t border-[var(--color-rule)]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--color-text-primary)]">
            Permitted transitions
          </span>
          <span className="font-mono text-[10px] text-[var(--color-text-muted)] tabular-nums">
            {allowedNext.length} valid
          </span>
        </div>

        {terminal ? (
          <div className="p-3 bg-[var(--color-page)] rounded-[4px] border border-[var(--color-rule)] text-xs text-[var(--color-text-secondary)] space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
              <Lock className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              <span>Immutable terminal stage</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
              Cases in Closed status are permanently sealed. No outgoing transitions are permitted.
            </p>
          </div>
        ) : allowedNext.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] italic">
            No outgoing transitions available.
          </p>
        ) : (
          <div className="space-y-2">
            {allowedNext.map((target) => (
              <button
                key={target}
                type="button"
                onClick={() => onSelectStatus(target)}
                className="w-full text-left p-2.5 rounded-[4px] border border-[var(--color-rule)] hover:border-[var(--color-action)] bg-surface hover:bg-[var(--color-page)] text-xs flex items-center justify-between transition-none cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--sla-on-track-text)]" />
                  <span className="font-medium text-[var(--color-text-primary)]">{target}</span>
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)] group-hover:text-[var(--color-action)]">
                  Inspect →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guard Rules */}
      {guardRules.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--color-rule)]">
          <span className="text-xs font-medium text-[var(--color-text-primary)] block">
            Entry guard rules
          </span>
          <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
            {guardRules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[var(--color-text-muted)]">•</span>
                <span className="text-[11px] leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
