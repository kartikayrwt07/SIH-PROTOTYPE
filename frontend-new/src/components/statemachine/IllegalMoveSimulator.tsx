import React, { useState } from "react";
import type { CaseStatus } from "@/types/ui";
import {
  ALL_STATUSES,
  canTransition,
  getAllowedTransitions,
  isTerminal,
} from "@/lib/stateMachine";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

interface SimulationPreset {
  label: string;
  from: CaseStatus;
  to: CaseStatus;
  remarks: string;
  isExpectedValid: boolean;
  explanation: string;
}

const PRESETS: SimulationPreset[] = [
  {
    label: "Illegal Skip: Received → Resolved",
    from: "Received",
    to: "Resolved",
    remarks: "Attempting to resolve complaint immediately upon intake",
    isExpectedValid: false,
    explanation: "Direct resolution without triage, assignment, or investigation violates AICTE statutory protocol.",
  },
  {
    label: "Illegal Jump: Under Triage → Closed",
    from: "Under Triage",
    to: "Closed",
    remarks: "Attempting direct administrative closure",
    isExpectedValid: false,
    explanation: "Cases under triage must proceed to bureau assignment and cannot be abruptly closed.",
  },
  {
    label: "Terminal Violation: Closed → In Progress",
    from: "Closed",
    to: "In Progress",
    remarks: "Attempting to reopen a permanently sealed case",
    isExpectedValid: false,
    explanation: "Closed status is terminal and immutable under AICTE data governance policy.",
  },
  {
    label: "Valid Move: Assigned → In Progress",
    from: "Assigned",
    to: "In Progress",
    remarks: "Desk officer commencing investigation and institutional verification",
    isExpectedValid: true,
    explanation: "Standard operational progression once an officer is designated.",
  },
  {
    label: "Valid Reopen: Resolved → In Progress",
    from: "Resolved",
    to: "In Progress",
    remarks: "Reopening investigation following complainant review petition",
    isExpectedValid: true,
    explanation: "AICTE rules allow resolved cases to be reopened if new evidence emerges.",
  },
];

interface SimulationResult {
  isValid: boolean;
  statusCode: number;
  errorCode?: string;
  message: string;
  from: CaseStatus;
  to: CaseStatus;
  allowedNext: CaseStatus[];
  missingRemarks?: boolean;
}

export function IllegalMoveSimulator() {
  const [fromState, setFromState] = useState<CaseStatus>("Received");
  const [toState, setToState] = useState<CaseStatus>("Resolved");
  const [remarks, setRemarks] = useState<string>("Bypassing investigation steps");
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();

    const allowed = getAllowedTransitions(fromState);
    const valid = canTransition(fromState, toState);
    const hasRemarks = remarks.trim().length > 0;

    if (!valid) {
      setResult({
        isValid: false,
        statusCode: 422,
        errorCode: "ILLEGAL_STATE_TRANSITION",
        message: `Illegal transition: Cannot transition from '${fromState}' to '${toState}'. Allowed next states: [${
          allowed.length > 0 ? allowed.map((s) => `'${s}'`).join(", ") : "None (Terminal State)"
        }].`,
        from: fromState,
        to: toState,
        allowedNext: allowed,
      });
    } else if (!hasRemarks) {
      setResult({
        isValid: false,
        statusCode: 422,
        errorCode: "VALIDATION_ERROR",
        message: `Guard rule failed: Mandatory remarks/justification required for advancing to '${toState}'.`,
        from: fromState,
        to: toState,
        allowedNext: allowed,
        missingRemarks: true,
      });
    } else {
      setResult({
        isValid: true,
        statusCode: 200,
        message: `Valid state transition: '${fromState}' → '${toState}' fully complies with AICTE statutory lifecycle rules.`,
        from: fromState,
        to: toState,
        allowedNext: allowed,
      });
    }
  };

  const handleApplyPreset = (p: SimulationPreset) => {
    setFromState(p.from);
    setToState(p.to);
    setRemarks(p.remarks);

    // Auto-run simulation for immediate Hackathon testing feedback
    const allowed = getAllowedTransitions(p.from);
    const valid = canTransition(p.from, p.to);

    if (!valid) {
      setResult({
        isValid: false,
        statusCode: 422,
        errorCode: "ILLEGAL_STATE_TRANSITION",
        message: `Illegal transition: Cannot transition from '${p.from}' to '${p.to}'. Allowed next states: [${
          allowed.length > 0 ? allowed.map((s) => `'${s}'`).join(", ") : "None (Terminal State)"
        }].`,
        from: p.from,
        to: p.to,
        allowedNext: allowed,
      });
    } else {
      setResult({
        isValid: true,
        statusCode: 200,
        message: `Valid state transition: '${p.from}' → '${p.to}' fully complies with AICTE statutory lifecycle rules.`,
        from: p.from,
        to: p.to,
        allowedNext: allowed,
      });
    }
  };

  return (
    <Card className="border border-border/60 shadow-none bg-card">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                Lifecycle Guard Rule Simulator ("Try an Illegal Move")
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Test state transition validation guards. Attempt illegal jumps, terminal mutations, or legal progressions.
              </p>
            </div>
          </div>

          <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto">
            HTTP 422 vs 200 Simulator
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Preset Evaluation Buttons */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Test Scenarios (Click to load & simulate):
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`text-xs font-medium border rounded-md px-2.5 py-1 text-left transition-colors cursor-pointer flex items-center gap-1.5 ${
                  p.isExpectedValid
                    ? "bg-[var(--sla-ontrack-bg)] hover:bg-[var(--sla-ontrack-bg)]/80 border-[var(--sla-ontrack-text)]/25 text-[var(--color-text-primary)]"
                    : "bg-[var(--sla-overdue-bg)] hover:bg-[var(--sla-overdue-bg)]/80 border-[var(--sla-overdue-text)]/25 text-[var(--color-text-primary)]"
                }`}
              >
                {p.isExpectedValid ? (
                  <ShieldCheck className="h-3 w-3 text-[var(--sla-ontrack-text)] shrink-0" />
                ) : (
                  <ShieldAlert className="h-3 w-3 text-[var(--sla-overdue-text)] shrink-0" />
                )}
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Transition Form */}
        <form onSubmit={handleRunSimulation} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* From State */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Source State (From):</Label>
              <Select
                value={fromState}
                onValueChange={(val) => setFromState(val as CaseStatus)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status} {isTerminal(status) ? "(Terminal)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To State */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Target State (To):</Label>
              <Select
                value={toState}
                onValueChange={(val) => setToState(val as CaseStatus)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Remarks / Justification Statement:</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Mandatory administrative justification..."
              className="h-9 text-xs font-mono text-[11px]"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Simulates the real backend FastAPI lifecycle service validator.</span>
            </span>

            <Button type="submit" size="sm" className="text-xs gap-1.5 shadow-2xs">
              <Play className="h-3.5 w-3.5" />
              <span>Attempt State Transition</span>
            </Button>
          </div>
        </form>

        {/* Simulation Output Card */}
        {result && (
          <div className="pt-2">
            {result.isValid ? (
              /* Valid Transition Result */
              <div className="bg-[var(--sla-ontrack-bg)] border border-[var(--sla-ontrack-text)]/25 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
                    <CheckCircle2 className="h-5 w-5 text-[var(--sla-ontrack-text)]" />
                    <span>Transition Validation Passed</span>
                  </div>
                  <Badge className="bg-[var(--sla-ontrack-text)] text-white font-mono text-xs">
                    HTTP {result.statusCode} OK
                  </Badge>
                </div>

                <p className="text-[var(--color-text-secondary)] leading-relaxed font-medium">
                  {result.message}
                </p>

                <div className="bg-white/70 p-2.5 rounded border border-[var(--sla-ontrack-text)]/20 text-[11px] text-[var(--color-text-secondary)] flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-text-primary)]">Workflow Rule:</span>
                  <span>
                    Moving from <strong>{result.from}</strong> to <strong>{result.to}</strong> is legally recognized in the AICTE finite state machine.
                  </span>
                </div>
              </div>
            ) : (
              /* Illegal Transition Blocked Result */
              <div className="bg-[var(--sla-overdue-bg)] border border-[var(--sla-overdue-text)]/25 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
                    <XCircle className="h-5 w-5 text-[var(--sla-overdue-text)]" />
                    <span>Transition Blocked by State Machine Guard</span>
                  </div>
                  <Badge className="bg-[var(--sla-overdue-text)] text-white font-mono text-xs">
                    HTTP {result.statusCode} Unprocessable Entity
                  </Badge>
                </div>

                <div className="bg-white/70 p-2.5 rounded border border-[var(--sla-overdue-text)]/20 font-mono text-[11px] text-[var(--color-text-primary)] space-y-1">
                  <div className="font-bold text-[var(--sla-overdue-text)]">
                    Error Code: {result.errorCode}
                  </div>
                  <div>{result.message}</div>
                </div>

                <div className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed pt-1">
                  <strong className="text-[var(--color-text-primary)]">AICTE Regulatory Guard:</strong> Arbitrary lifecycle state skipping is blocked to guarantee procedural integrity, audit transparency, and prevent uninvestigated closures.
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
