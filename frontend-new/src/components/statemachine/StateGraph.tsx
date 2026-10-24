import React from "react";
import type { CaseStatus } from "@/types/ui";
import { ALL_STATUSES, ALLOWED_TRANSITIONS } from "@/lib/stateMachine";
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
  Repeat2,
  Undo2,
  Check,
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

const STAGE_NUMBERS: Record<CaseStatus, string> = {
  Received: "01",
  Registered: "02",
  "Under Triage": "03",
  Assigned: "04",
  "In Progress": "05",
  "Awaiting Information": "06",
  "Under Review": "07",
  Resolved: "08",
  Closed: "09",
};

const STATUS_DESCRIPTIONS: Record<CaseStatus, string> = {
  Received: "Raw grievance intake logged",
  Registered: "Official AICTE ID issued",
  "Under Triage": "Jurisdiction & priority classified",
  Assigned: "Desk officer assigned in bureau",
  "In Progress": "Active inquiry & evidence collection",
  "Awaiting Information": "Documentary clarification pending",
  "Under Review": "Supervisory order review",
  Resolved: "Administrative order issued",
  Closed: "Permanently sealed ledger archive",
};

export function StateGraph({
  selectedStatus,
  onSelectStatus,
  caseCountsByStatus = {} as Record<CaseStatus, number>,
}: StateGraphProps) {
  const allowedNext = ALLOWED_TRANSITIONS[selectedStatus] ?? [];

  return (
    <div className="space-y-6">
      {/* Interactive Topology Canvas */}
      <div className="bg-white/85 dark:bg-[#0B0813]/90 backdrop-blur-md border border-[#ECE6F4] dark:border-[#201533] rounded-[12px] p-6 space-y-6 shadow-[0_4px_24px_rgba(112,82,200,0.03)]">
        {/* Canvas Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ECE6F4] dark:border-[#201533]">
          <div>
            <h3 className="font-serif text-base font-semibold text-[var(--color-ink)] flex items-center gap-2">
              <span>Interactive state topology</span>
              <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-[#FAF8FE] dark:bg-[#05040A] border border-[#ECE6F4] dark:border-[#201533] text-[var(--color-action)] shadow-xs">
                9 Stages
              </span>
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Click any stage to simulate transition paths and evaluate statutory gate rules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--color-action)] shadow-[0_0_6px_rgba(112,82,200,0.35)]" />
              <span className="font-medium text-[var(--color-ink)]">Selected stage</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--sla-ontrack-text)]" />
              <span>Allowed transition</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--color-text-muted)]" />
              <span>Locked / Terminal</span>
            </span>
          </div>
        </div>

        {/* Intuitive Active State Banner */}
        <div className="p-4 bg-white/70 dark:bg-[#0B0813]/80 backdrop-blur-sm border border-[#ECE6F4] dark:border-[#201533] rounded-[8px] flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-[var(--color-action)] text-white flex items-center justify-center font-mono font-bold text-xs shadow-[0_0_8px_rgba(112,82,200,0.35)]">
              {STAGE_NUMBERS[selectedStatus]}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">
                Current stage focus
              </div>
              <div className="font-semibold text-sm text-[var(--color-ink)] flex items-center gap-2">
                <span>{selectedStatus}</span>
                <span className="font-mono text-[11px] font-normal text-[var(--color-text-secondary)]">
                  ({caseCountsByStatus[selectedStatus] ?? 0} active cases)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
              Permitted forward paths:
            </span>
            {allowedNext.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {allowedNext.map((next) => (
                  <button
                    key={next}
                    type="button"
                    onClick={() => onSelectStatus(next)}
                    className="px-2.5 py-1 bg-[#F0F9F4] dark:bg-[#163824]/40 border border-[#257D4E]/30 dark:border-[#34D399]/40 text-[#257D4E] dark:text-[#34D399] rounded-[4px] text-xs font-semibold hover:bg-[#E6F5EC] dark:hover:bg-[#163824]/70 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title={`Click to inspect transition to ${next}`}
                  >
                    <span>{STAGE_NUMBERS[next]}. {next}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs text-[var(--color-text-muted)] italic px-2 py-0.5 bg-[var(--color-page)] rounded border border-[var(--color-rule)]">
                Terminal immutable archive
              </span>
            )}
          </div>
        </div>

        {/* 3-Tier Lifecycle Flow Layout */}
        <div className="space-y-8 pt-1">
          {/* Phase 1: Intake & Bureau Triage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-action)] shadow-[0_0_6px_rgba(112,82,200,0.4)]" />
                <span className="text-[var(--color-ink)] font-bold">Phase 1</span>
                <span>·</span>
                <span>Intake & Jurisdictional Triage</span>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Linear Registration Flow</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["Received", "Registered", "Under Triage"] as CaseStatus[]).map((status, idx) => {
                const Icon = STATUS_ICONS[status];
                const isSelected = selectedStatus === status;
                const isNext = allowedNext.includes(status);
                const count = caseCountsByStatus[status] ?? 0;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onSelectStatus(status)}
                    className={`relative text-left p-4.5 rounded-[8px] border transition-all cursor-pointer flex flex-col justify-between min-h-[112px] group ${
                      isSelected
                        ? "bg-gradient-to-br from-[#7052C8] to-[#5939A7] text-white border-[#7052C8] shadow-[0_4px_16px_rgba(112,82,200,0.25)] ring-2 ring-[#7052C8]/30"
                        : isNext
                        ? "bg-[#F0F9F4] dark:bg-[#143322]/40 border-[#257D4E]/30 dark:border-[#34D399]/40 shadow-xs hover:bg-[#E6F5EC] dark:hover:bg-[#143322]/70 text-[#257D4E] dark:text-[#34D399]"
                        : "bg-white/60 dark:bg-[#0B0813]/90 border-[#ECE6F4] dark:border-[#201533] hover:border-[#7052C8]/40 dark:hover:border-[#9333EA]/50 hover:bg-white/90 dark:hover:bg-[#120D20] shadow-xs"
                    }`}
                  >
                    {/* Top Row: Icon + Stage Name + Step Number */}
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : isNext
                              ? "bg-[#F0F9F4] text-[#257D4E] border border-[#257D4E]/30"
                              : "bg-[var(--color-page)] dark:bg-[#05040A] text-[var(--color-text-secondary)] dark:text-[#A396BE] border border-[var(--color-rule)] dark:border-[#201533] group-hover:text-[var(--color-action)] dark:group-hover:text-[#C084FC]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono text-[10px] font-bold ${
                                isSelected ? "text-white/80" : "text-[var(--color-text-muted)]"
                              }`}
                            >
                              {STAGE_NUMBERS[status]}
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                isSelected
                                  ? "text-white"
                                  : isNext
                                  ? "text-[#257D4E]"
                                  : "text-[var(--color-text-primary)]"
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] block mt-0.5 ${
                              isSelected ? "text-white/80" : "text-[var(--color-text-muted)]"
                            }`}
                          >
                            {STATUS_DESCRIPTIONS[status]}
                          </span>
                        </div>
                      </div>

                      {count > 0 && (
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded tabular-nums font-medium ${
                            isSelected
                              ? "bg-white/20 text-white border border-white/20"
                              : "bg-[var(--color-page)] dark:bg-[#05040A] border border-[var(--color-rule)] dark:border-[#201533] text-[var(--color-text-secondary)] dark:text-[#A396BE]"
                          }`}
                          title={`${count} active cases`}
                        >
                          {count}
                        </span>
                      )}
                    </div>

                    {/* Bottom Status / Guidance Cue */}
                    <div className="pt-3 border-t border-black/5 mt-2">
                      {isNext ? (
                        <div className="flex items-center justify-between text-[11px] text-[#257D4E] font-semibold">
                          <span className="flex items-center gap-1">
                            <ArrowRight className="h-3.5 w-3.5" />
                            <span>Permitted next stage</span>
                          </span>
                          <span className="text-[10px] opacity-75">Click to inspect</span>
                        </div>
                      ) : isSelected ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-white font-medium">
                          <Sparkles className="h-3.5 w-3.5 text-white/90" />
                          <span>Inspecting guard rules</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                          <span>{idx < 2 ? "Advances to step 0" + (idx + 2) : "Ready for bureau dispatch"}</span>
                          {idx < 2 && <ArrowRight className="h-3 w-3 opacity-50" />}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phase 2: Assignment & Active Investigation (Evidence Loop) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-action)]" />
                <span className="text-[var(--color-ink)] font-bold">Phase 2</span>
                <span>·</span>
                <span>Assignment & Active Investigation</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-action)] font-medium bg-[var(--color-page)] dark:bg-[#0B0813] px-2 py-0.5 rounded border border-[var(--color-rule)] dark:border-[#201533] dark:text-[#C084FC]">
                <Repeat2 className="h-3 w-3" />
                Evidence Clarification Loop
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {(["Assigned", "In Progress", "Awaiting Information", "Under Review"] as CaseStatus[]).map(
                (status) => {
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
                      className={`relative text-left p-4.5 rounded-[8px] border transition-all cursor-pointer flex flex-col justify-between min-h-[112px] group ${
                        isSelected
                          ? "bg-gradient-to-br from-[#7052C8] to-[#5939A7] text-white border-[#7052C8] shadow-[0_4px_16px_rgba(112,82,200,0.25)] ring-2 ring-[#7052C8]/30"
                          : isNext
                          ? "bg-[#F0F9F4] dark:bg-[#143322]/40 border-[#257D4E]/30 dark:border-[#34D399]/40 shadow-xs hover:bg-[#E6F5EC] dark:hover:bg-[#143322]/70 text-[#257D4E] dark:text-[#34D399]"
                          : "bg-white/60 dark:bg-[#0B0813]/90 border-[#ECE6F4] dark:border-[#201533] hover:border-[#7052C8]/40 dark:hover:border-[#9333EA]/50 hover:bg-white/90 dark:hover:bg-[#120D20] shadow-xs"
                      }`}
                    >
                      {/* Top Row: Icon + Stage Name */}
                      <div className="flex items-start justify-between gap-2 w-full">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : isNext
                                ? "bg-[#F0F9F4] text-[#257D4E] border border-[#257D4E]/30"
                                : "bg-[var(--color-page)] dark:bg-[#05040A] text-[var(--color-text-secondary)] dark:text-[#A396BE] border border-[var(--color-rule)] dark:border-[#201533] group-hover:text-[var(--color-action)] dark:group-hover:text-[#C084FC]"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-[10px] font-bold ${
                                  isSelected ? "text-white/80" : "text-[var(--color-text-muted)]"
                                }`}
                              >
                                {STAGE_NUMBERS[status]}
                              </span>
                              <span
                                className={`text-xs font-semibold ${
                                  isSelected
                                    ? "text-white"
                                    : isNext
                                    ? "text-[#257D4E]"
                                    : "text-[var(--color-text-primary)]"
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] block mt-0.5 ${
                                isSelected ? "text-white/80" : "text-[var(--color-text-muted)]"
                              }`}
                            >
                              {STATUS_DESCRIPTIONS[status]}
                            </span>
                          </div>
                        </div>

                        {count > 0 && (
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded tabular-nums font-medium ${
                              isSelected
                                ? "bg-white/20 text-white border border-white/20"
                                : "bg-[var(--color-page)] dark:bg-[#05040A] border border-[var(--color-rule)] dark:border-[#201533] text-[var(--color-text-secondary)] dark:text-[#A396BE]"
                            }`}
                            title={`${count} active cases`}
                          >
                            {count}
                          </span>
                        )}
                      </div>

                      {/* Bottom Status / Guidance Cue */}
                      <div className="pt-3 border-t border-black/5 mt-2">
                        {isNext ? (
                          <div className="flex items-center justify-between text-[11px] text-[#257D4E] font-semibold">
                            <span className="flex items-center gap-1">
                              <ArrowRight className="h-3.5 w-3.5" />
                              <span>Permitted next stage</span>
                            </span>
                            <span className="text-[10px] opacity-75">Click</span>
                          </div>
                        ) : isSelected ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-white font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-white/90" />
                            <span>Inspecting guard rules</span>
                          </div>
                        ) : isLoop ? (
                          <div className="flex items-center gap-1 text-[10px] text-[var(--sla-approaching-text)] font-medium">
                            <Repeat2 className="h-3 w-3" />
                            <span>Inquiry pause cycle</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            {status === "Assigned"
                              ? "Desk allocation"
                              : status === "In Progress"
                              ? "Primary investigation"
                              : "Supervisory gate"}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Phase 3: Administrative Determination & Seal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-action)]" />
                <span className="text-[var(--color-ink)] font-bold">Phase 3</span>
                <span>·</span>
                <span>Administrative Determination & Archive</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                <Undo2 className="h-3 w-3 text-[var(--color-action)]" />
                <span>Reopening allowed from Resolved to In Progress</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["Resolved", "Closed"] as CaseStatus[]).map((status) => {
                const Icon = STATUS_ICONS[status];
                const isSelected = selectedStatus === status;
                const isNext = allowedNext.includes(status);
                const count = caseCountsByStatus[status] ?? 0;
                const isTerminal = status === "Closed";

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onSelectStatus(status)}
                    className={`relative text-left p-4.5 rounded-[8px] border transition-all cursor-pointer flex flex-col justify-between min-h-[112px] group ${
                      isSelected
                        ? "bg-gradient-to-br from-[#7052C8] to-[#5939A7] text-white border-[#7052C8] shadow-[0_4px_16px_rgba(112,82,200,0.25)] ring-2 ring-[#7052C8]/30"
                        : isNext
                        ? "bg-[#F0F9F4] dark:bg-[#143322]/40 border-[#257D4E]/30 dark:border-[#34D399]/40 shadow-xs hover:bg-[#E6F5EC] dark:hover:bg-[#143322]/70 text-[#257D4E] dark:text-[#34D399]"
                        : "bg-white/60 dark:bg-[#0B0813]/90 border-[#ECE6F4] dark:border-[#201533] hover:border-[#7052C8]/40 dark:hover:border-[#9333EA]/50 hover:bg-white/90 dark:hover:bg-[#120D20] shadow-xs"
                    }`}
                  >
                    {/* Top Row: Icon + Stage Name */}
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : isNext
                              ? "bg-[#F0F9F4] text-[#257D4E] border border-[#257D4E]/30"
                              : isTerminal
                              ? "bg-[var(--color-page)] text-[var(--color-text-muted)] border border-[var(--color-rule)]"
                              : "bg-[var(--color-page)] text-[var(--sla-ontrack-text)] border border-[var(--color-rule)]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono text-[10px] font-bold ${
                                isSelected ? "text-white/80" : "text-[var(--color-text-muted)]"
                              }`}
                            >
                              {STAGE_NUMBERS[status]}
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                isSelected
                                  ? "text-white"
                                  : isNext
                                  ? "text-[#257D4E]"
                                  : "text-[var(--color-text-primary)]"
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] block mt-0.5 ${
                              isSelected ? "text-white/80" : "text-[var(--color-text-muted)]"
                            }`}
                          >
                            {STATUS_DESCRIPTIONS[status]}
                          </span>
                        </div>
                      </div>

                      {count > 0 && (
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded tabular-nums font-medium ${
                            isSelected
                              ? "bg-white/20 text-white border border-white/20"
                              : "bg-[var(--color-page)] dark:bg-[#05040A] border border-[var(--color-rule)] dark:border-[#201533] text-[var(--color-text-secondary)] dark:text-[#A396BE]"
                          }`}
                          title={`${count} cases`}
                        >
                          {count}
                        </span>
                      )}
                    </div>

                    {/* Bottom Status / Guidance Cue */}
                    <div className="pt-3 border-t border-black/5 mt-2">
                      {isNext ? (
                        <div className="flex items-center justify-between text-[11px] text-[#257D4E] font-semibold">
                          <span className="flex items-center gap-1">
                            <ArrowRight className="h-3.5 w-3.5" />
                            <span>Permitted next stage</span>
                          </span>
                          <span className="text-[10px] opacity-75">Click</span>
                        </div>
                      ) : isSelected ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-white font-medium">
                          <Sparkles className="h-3.5 w-3.5 text-white/90" />
                          <span>Inspecting guard rules</span>
                        </div>
                      ) : isTerminal ? (
                        <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          <span>Permanent terminal ledger (locked)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--sla-ontrack-text)] flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>Resolution order dispatched</span>
                        </span>
                      )}
                    </div>
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
