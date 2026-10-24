import React from "react";
import type { CaseStatus } from "@/types/ui";
import { ALL_STATUSES, ALLOWED_TRANSITIONS } from "@/lib/stateMachine";
import { Badge } from "@/components/ui/badge";
import {
  Inbox,
  FileCheck,
  Filter,
  UserCheck,
  Activity,
  HelpCircle,
  Eye,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface StateGraphProps {
  selectedStatus: CaseStatus;
  onSelectStatus: (status: CaseStatus) => void;
  caseCountsByStatus?: Record<CaseStatus, number>;
}

const STATUS_ICONS: Record<CaseStatus, React.ElementType> = {
  Received: Inbox,
  Registered: FileCheck,
  "Under Triage": Filter,
  Assigned: UserCheck,
  "In Progress": Activity,
  "Awaiting Information": HelpCircle,
  "Under Review": Eye,
  Resolved: CheckCircle2,
  Closed: Lock,
};

const STATUS_DESCRIPTIONS: Record<CaseStatus, string> = {
  Received: "Raw grievance submitted",
  Registered: "Official AICTE ID issued",
  "Under Triage": "Bureau & priority classified",
  Assigned: "Assigned to desk officer",
  "In Progress": "Active investigation underway",
  "Awaiting Information": "Pending response",
  "Under Review": "Supervisory review",
  Resolved: "Resolution order issued",
  Closed: "Immutable terminal archive",
};

export function StateGraph({
  selectedStatus,
  onSelectStatus,
  caseCountsByStatus = {} as Record<CaseStatus, number>,
}: StateGraphProps) {
  const allowedNext = ALLOWED_TRANSITIONS[selectedStatus] ?? [];

  return (
    <div className="space-y-6">
      {/* Graph Visual Canvas */}
      <div className="bg-surface border border-[var(--color-rule)] rounded-[6px] p-6 space-y-6">
        {/* Graph Header / Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--color-rule)] text-xs">
          <div>
            <h3 className="font-serif text-sm font-semibold text-[var(--color-ink)]">
              Interactive state topology
            </h3>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Select any stage to inspect permissible transitions and statutory guard conditions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--color-action)]" />
              <span>Selected stage</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--sla-on-track-text)]" />
              <span>Allowed transition</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--color-text-muted)]" />
              <span>Terminal state</span>
            </span>
          </div>
        </div>

        {/* 3-Tier Lifecycle Flow Layout */}
        <div className="space-y-8">
          {/* Phase 1: Intake & Bureau Triage */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink)]" />
              <span>Phase 1 · Intake & Jurisdictional Triage</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {(["Received", "Registered", "Under Triage"] as CaseStatus[]).map((status) => {
                const Icon = STATUS_ICONS[status];
                const isSelected = selectedStatus === status;
                const isNext = allowedNext.includes(status);
                const count = caseCountsByStatus[status] ?? 0;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onSelectStatus(status)}
                    className={`text-left p-4 rounded-[6px] border transition-all cursor-pointer flex flex-col justify-between min-h-[104px] ${
                      isSelected
                        ? "bg-[var(--color-page)] border-[var(--color-action)] ring-1 ring-[var(--color-action)]"
                        : isNext
                        ? "bg-[#E4F4EC]/40 border-[var(--sla-on-track-text)] hover:bg-[#E4F4EC]/60"
                        : "bg-surface border-[var(--color-rule)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-page)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-[var(--color-action)] text-white"
                              : isNext
                              ? "bg-[var(--sla-on-track-bg)] text-[var(--sla-on-track-text)]"
                              : "bg-[var(--color-page)] text-[var(--color-text-secondary)] border border-[var(--color-rule)]"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold block text-[var(--color-text-primary)]">
                            {status}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)] block">
                            {STATUS_DESCRIPTIONS[status]}
                          </span>
                        </div>
                      </div>

                      {count > 0 && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-page)] border border-[var(--color-rule)] text-[var(--color-text-secondary)] tabular-nums">
                          {count}
                        </span>
                      )}
                    </div>

                    {isNext && (
                      <div className="pt-2 flex items-center gap-1 text-[10px] text-[var(--sla-on-track-text)] font-semibold">
                        <ArrowRight className="h-3 w-3" />
                        <span>Permitted next stage</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="pt-2 flex items-center gap-1 text-[10px] text-[var(--color-action)] font-semibold uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" />
                        <span>Inspecting rules</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phase 2: Assignment & Active Investigation */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink)]" />
              <span>Phase 2 · Assignment & Active Investigation (Evidence Loop)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {(["Assigned", "In Progress", "Awaiting Information", "Under Review"] as CaseStatus[]).map((status) => {
                const Icon = STATUS_ICONS[status];
                const isSelected = selectedStatus === status;
                const isNext = allowedNext.includes(status);
                const count = caseCountsByStatus[status] ?? 0;
                const isLoop = status === "Awaiting Information";

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onSelectStatus(status)}
                    className={`text-left p-4 rounded-[6px] border transition-all cursor-pointer flex flex-col justify-between min-h-[104px] ${
                      isSelected
                        ? "bg-[var(--color-page)] border-[var(--color-action)] ring-1 ring-[var(--color-action)]"
                        : isNext
                        ? "bg-[#E4F4EC]/40 border-[var(--sla-on-track-text)] hover:bg-[#E4F4EC]/60"
                        : isLoop
                        ? "bg-[#FFF4DB]/20 border-[var(--sla-approaching-text)]/40 hover:border-[var(--sla-approaching-text)]"
                        : "bg-surface border-[var(--color-rule)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-page)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-[var(--color-action)] text-white"
                              : isNext
                              ? "bg-[var(--sla-on-track-bg)] text-[var(--sla-on-track-text)]"
                              : "bg-[var(--color-page)] text-[var(--color-text-secondary)] border border-[var(--color-rule)]"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold block text-[var(--color-text-primary)]">
                            {status}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)] block">
                            {STATUS_DESCRIPTIONS[status]}
                          </span>
                        </div>
                      </div>

                      {count > 0 && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-page)] border border-[var(--color-rule)] text-[var(--color-text-secondary)] tabular-nums">
                          {count}
                        </span>
                      )}
                    </div>

                    {isNext && (
                      <div className="pt-2 flex items-center gap-1 text-[10px] text-[var(--sla-on-track-text)] font-semibold">
                        <ArrowRight className="h-3 w-3" />
                        <span>Permitted next stage</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="pt-2 flex items-center gap-1 text-[10px] text-[var(--color-action)] font-semibold uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" />
                        <span>Inspecting rules</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phase 3: Determination & Closure */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink)]" />
              <span>Phase 3 · Administrative Determination & Archive</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(["Resolved", "Closed"] as CaseStatus[]).map((status) => {
                const Icon = STATUS_ICONS[status];
                const isSelected = selectedStatus === status;
                const isNext = allowedNext.includes(status);
                const count = caseCountsByStatus[status] ?? 0;
                const isTerminalStatus = status === "Closed";

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onSelectStatus(status)}
                    className={`text-left p-4 rounded-[6px] border transition-all cursor-pointer flex flex-col justify-between min-h-[104px] ${
                      isSelected
                        ? "bg-[var(--color-page)] border-[var(--color-action)] ring-1 ring-[var(--color-action)]"
                        : isNext
                        ? "bg-[#E4F4EC]/40 border-[var(--sla-on-track-text)] hover:bg-[#E4F4EC]/60"
                        : isTerminalStatus
                        ? "bg-surface border-[var(--color-rule)] hover:border-[var(--color-text-muted)]"
                        : "bg-surface border-[var(--color-rule)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-page)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-[var(--color-action)] text-white"
                              : isNext
                              ? "bg-[var(--sla-on-track-bg)] text-[var(--sla-on-track-text)]"
                              : "bg-[var(--color-page)] text-[var(--color-text-secondary)] border border-[var(--color-rule)]"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold block text-[var(--color-text-primary)]">
                            {status}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)] block">
                            {STATUS_DESCRIPTIONS[status]}
                          </span>
                        </div>
                      </div>

                      {count > 0 && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-page)] border border-[var(--color-rule)] text-[var(--color-text-secondary)] tabular-nums">
                          {count}
                        </span>
                      )}
                    </div>

                    {isNext && (
                      <div className="pt-2 flex items-center gap-1 text-[10px] text-[var(--sla-on-track-text)] font-semibold">
                        <ArrowRight className="h-3 w-3" />
                        <span>Permitted next stage</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="pt-2 flex items-center gap-1 text-[10px] text-[var(--color-action)] font-semibold uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" />
                        <span>Inspecting rules</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
