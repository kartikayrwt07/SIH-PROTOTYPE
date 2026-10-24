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
  RotateCcw,
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
  "Awaiting Information": "Pending complainant response",
  "Under Review": "Supervisory review underway",
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
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-none relative overflow-hidden">
        {/* Graph Header / Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Interactive State Diagram</span>
            <span className="text-muted-foreground">· Click any node to inspect allowed transitions & guards</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/20" />
              <span>Selected State</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Allowed Next Transition</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span>Terminal State</span>
            </span>
          </div>
        </div>

        {/* 3-Tier Lifecycle Flow Layout */}
        <div className="pt-6 space-y-8">
          {/* Tier 1: Intake & Bureau Triage */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Phase 1 · Intake & Jurisdictional Triage</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
              {(["Received", "Registered", "Under Triage"] as CaseStatus[]).map(
                (status, idx) => {
                  const Icon = STATUS_ICONS[status];
                  const isSelected = selectedStatus === status;
                  const isNext = allowedNext.includes(status);
                  const count = caseCountsByStatus[status] ?? 0;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onSelectStatus(status)}
                      className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer relative group flex flex-col justify-between min-h-[96px] ${
                        isSelected
                          ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-xs"
                          : isNext
                          ? "bg-emerald-50/40 border-emerald-400 hover:bg-emerald-50/70 shadow-2xs"
                          : "bg-card border-border hover:border-primary/40 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : isNext
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block text-foreground">
                              {status}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {STATUS_DESCRIPTIONS[status]}
                            </span>
                          </div>
                        </div>

                        {count > 0 && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                            {count} cases
                          </Badge>
                        )}
                      </div>

                      {isNext && (
                        <div className="pt-2 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                          <ArrowRight className="h-3 w-3" />
                          <span>Valid Next Target</span>
                        </div>
                      )}

                      {isSelected && (
                        <div className="pt-2 flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-wider">
                          <Sparkles className="h-3 w-3" />
                          <span>Inspecting Guards</span>
                        </div>
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Tier 2: Assignment, Investigation & Review */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Phase 2 · Assignment & Active Investigation (with Evidence Loop)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 relative">
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
                      className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer relative group flex flex-col justify-between min-h-[96px] ${
                        isSelected
                          ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-xs"
                          : isNext
                          ? "bg-emerald-50/40 border-emerald-400 hover:bg-emerald-50/70 shadow-2xs"
                          : isLoop
                          ? "bg-amber-50/20 border-amber-200/80 hover:border-amber-300"
                          : "bg-card border-border hover:border-primary/40 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : isNext
                                ? "bg-emerald-100 text-emerald-700"
                                : isLoop
                                ? "bg-amber-100 text-amber-800"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block text-foreground">
                              {status}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {STATUS_DESCRIPTIONS[status]}
                            </span>
                          </div>
                        </div>

                        {count > 0 && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                            {count} cases
                          </Badge>
                        )}
                      </div>

                      {isNext && (
                        <div className="pt-2 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                          <ArrowRight className="h-3 w-3" />
                          <span>Valid Next Target</span>
                        </div>
                      )}

                      {isSelected && (
                        <div className="pt-2 flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-wider">
                          <Sparkles className="h-3 w-3" />
                          <span>Inspecting Guards</span>
                        </div>
                      )}

                      {!isNext && !isSelected && isLoop && (
                        <div className="pt-2 flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                          <RotateCcw className="h-3 w-3" />
                          <span>↔ Bi-directional Loop</span>
                        </div>
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Tier 3: Resolution & Terminal Archive */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Phase 3 · Determination & Finality (with Reopen Support)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
              {(["Resolved", "Closed"] as CaseStatus[]).map((status) => {
                const Icon = STATUS_ICONS[status];
                const isSelected = selectedStatus === status;
                const isNext = allowedNext.includes(status);
                const count = caseCountsByStatus[status] ?? 0;
                const isTerminalClosed = status === "Closed";

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onSelectStatus(status)}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer relative group flex flex-col justify-between min-h-[96px] ${
                      isSelected
                        ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-xs"
                        : isNext
                        ? "bg-emerald-50/40 border-emerald-400 hover:bg-emerald-50/70 shadow-2xs"
                        : isTerminalClosed
                        ? "bg-slate-50 border-slate-300 hover:border-slate-400"
                        : "bg-card border-border hover:border-primary/40 hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : isNext
                              ? "bg-emerald-100 text-emerald-700"
                              : isTerminalClosed
                              ? "bg-slate-200 text-slate-800"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block text-foreground">
                            {status}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {STATUS_DESCRIPTIONS[status]}
                          </span>
                        </div>
                      </div>

                      {count > 0 && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                          {count} cases
                        </Badge>
                      )}
                    </div>

                    {isNext && (
                      <div className="pt-2 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                        <ArrowRight className="h-3 w-3" />
                        <span>Valid Next Target</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="pt-2 flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" />
                        <span>Inspecting Guards</span>
                      </div>
                    )}

                    {!isNext && !isSelected && isTerminalClosed && (
                      <div className="pt-2 flex items-center gap-1 text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
                        <Lock className="h-3 w-3" />
                        <span>Terminal State (No Exits)</span>
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
