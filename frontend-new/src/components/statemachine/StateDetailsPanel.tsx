import React from "react";
import type { CaseStatus } from "@/types/ui";
import {
  ALLOWED_TRANSITIONS,
  TRANSITION_GUARD_RULES,
  STATUS_STEP_INDEX,
  isTerminal,
  isActive,
} from "@/lib/stateMachine";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/cases/StatusChip";
import { Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Activity,
  Layers,
  Info,
} from "lucide-react";

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
  const stepIndex = STATUS_STEP_INDEX[status] ?? 0;

  return (
    <Card className="border border-border/60 shadow-none overflow-hidden bg-card">
      <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              State Inspector
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              Stage {stepIndex + 1} of 8
            </Badge>
          </div>

          <StatusChip status={status} />
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* State Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>{status}</span>
            {terminal ? (
              <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-800 font-semibold">
                Terminal
              </Badge>
            ) : active ? (
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-semibold">
                Active State
              </Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-semibold">
                Determined
              </Badge>
            )}
          </h3>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {EXTENDED_STATUS_DESCRIPTIONS[status]}
          </p>
        </div>

        {/* Case Register Density */}
        <div className="bg-muted/40 border border-border rounded-lg p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="text-muted-foreground">Current Cases in Register:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-foreground text-sm">
              {caseCount}
            </span>
            <Button asChild size="sm" variant="ghost" className="h-6 text-[11px] px-2 text-primary hover:underline">
              <Link to="/cases" search={{ status }}>
                View in Register →
              </Link>
            </Button>
          </div>
        </div>

        {/* Allowed Next Transitions */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
              <span>Allowed Next Transitions</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              {allowedNext.length} valid paths
            </span>
          </div>

          {terminal ? (
            <div className="p-3 bg-slate-100 rounded-md border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <Lock className="h-3.5 w-3.5 text-slate-600" />
                <span>Terminal State Finality</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Cases in 'Closed' status are permanently archived in the official register. No outgoing transitions are permitted.
              </p>
            </div>
          ) : allowedNext.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No further outgoing transitions defined.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {allowedNext.map((nextState) => {
                const isReopen = status === "Resolved" && nextState === "In Progress";
                const isEvidenceLoop =
                  (status === "In Progress" && nextState === "Awaiting Information") ||
                  (status === "Awaiting Information" && nextState === "In Progress") ||
                  (status === "Under Review" && nextState === "In Progress");

                return (
                  <button
                    key={nextState}
                    type="button"
                    onClick={() => onSelectStatus(nextState)}
                    className="p-2.5 rounded-md border border-border hover:border-emerald-500 bg-card hover:bg-emerald-50/30 transition-all text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-emerald-950">
                        {nextState}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground group-hover:text-emerald-800">
                      {isReopen && (
                        <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                          Reopen Case
                        </Badge>
                      )}
                      {isEvidenceLoop && (
                        <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200">
                          Loop
                        </Badge>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Transition Guard Rules */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Statutory Guard Conditions</span>
            </span>
          </div>

          <div className="space-y-1.5">
            {guardRules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-foreground bg-muted/30 p-2 rounded border border-border/60"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-tight">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
