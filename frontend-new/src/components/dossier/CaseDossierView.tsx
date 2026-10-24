import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCase } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type { ComplaintCase, CaseStatus } from "@/types/ui";
import { getAllowedTransitions } from "@/lib/stateMachine";
import {
  StatusMark,
  PriorityMark,
  SlaPill,
  LifecycleStrip,
  RedactionBar,
} from "@/components/shared";
import { AuditTimelineTab } from "./AuditTimelineTab";
import { InternalNotesTab } from "./InternalNotesTab";
import { AssignmentHistoryTab } from "./AssignmentHistoryTab";
import { ChangeStatusModal } from "./ChangeStatusModal";
import { ReassignModal } from "./ReassignModal";
import { EscalateModal } from "./EscalateModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft } from "lucide-react";

interface CaseDossierViewProps {
  caseRef: string;
}

const INSTITUTION_METADATA: Record<string, { state: string; district: string; type: string }> = {
  "inst-01": { state: "Rajasthan", district: "Kota", type: "State University" },
  "inst-02": { state: "Maharashtra", district: "Pune", type: "Deemed University" },
  "inst-03": { state: "Uttar Pradesh", district: "Noida", type: "Private University" },
  "inst-04": { state: "Punjab", district: "Mohali", type: "Private University" },
  "inst-05": { state: "Tamil Nadu", district: "Chennai", type: "Deemed University" },
  "inst-06": { state: "Maharashtra", district: "Mumbai", type: "Deemed University" },
  "inst-07": { state: "Karnataka", district: "Udupi", type: "Deemed University" },
  "inst-08": { state: "Punjab", district: "Phagwara", type: "Private University" },
  "inst-09": { state: "Tamil Nadu", district: "Kancheepuram", type: "Deemed University" },
  "inst-10": { state: "Karnataka", district: "Bengaluru", type: "Private University" },
  "inst-11": { state: "Tamil Nadu", district: "Coimbatore", type: "Government-Aided College" },
  "inst-12": { state: "Odisha", district: "Bhubaneswar", type: "Deemed University" },
  "inst-13": { state: "Karnataka", district: "Bengaluru", type: "Autonomous College" },
  "inst-14": { state: "Karnataka", district: "Bengaluru", type: "Affiliated Institute" },
  "inst-15": { state: "Karnataka", district: "Hubballi", type: "State Technological University" },
};

export function CaseDossierView({ caseRef }: CaseDossierViewProps) {
  const { role } = useRole();
  const isAuditor = role === "AUDITOR";

  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [targetStatusOverride, setTargetStatusOverride] = useState<CaseStatus | undefined>(undefined);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);

  const {
    data: caseItem,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["case", caseRef, role],
    queryFn: () => getCase(caseRef),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="py-6 px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="border-t border-[var(--color-rule)] pt-6 space-y-4">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !caseItem) {
    return (
      <div className="py-12 px-6 max-w-xl mx-auto text-center space-y-4">
        <div className="p-6 bg-surface border border-[var(--color-rule)] rounded-[4px] space-y-3">
          <AlertCircle className="h-8 w-8 text-[var(--sla-overdue-text)] mx-auto" />
          <h2 className="font-serif text-lg font-semibold text-[var(--color-ink)]">
            Case record not found
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {(error as Error)?.message || `Case file '${caseRef}' could not be retrieved.`}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs h-8 border-[var(--color-rule)]">
              Try again
            </Button>
            <Button asChild size="sm" className="text-xs h-8 bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90">
              <Link to="/cases">Return to case register</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isResolvedOrClosed = caseItem.status === "Resolved" || caseItem.status === "Closed";
  const isClosed = caseItem.status === "Closed";
  const isResolved = caseItem.status === "Resolved";
  const allowedTransitions = getAllowedTransitions(caseItem.status);

  // Role gating
  const canChangeStatus = !isAuditor && !isClosed && allowedTransitions.length > 0;
  const canReassign = (role === "ADMIN" || role === "SUPERVISOR") && !isClosed;
  const canEscalate = (role === "ADMIN" || role === "SUPERVISOR") && !isClosed && (caseItem.escalation_level ?? 0) < 2;
  const canReopen = !isAuditor && isResolved && allowedTransitions.includes("In Progress");

  // Metadata resolution
  const instMeta = INSTITUTION_METADATA[caseItem.institution_id] || {
    state: "Karnataka",
    district: "Bengaluru",
    type: "Technical Institute",
  };

  const handleOpenStatusModal = (target?: CaseStatus) => {
    setTargetStatusOverride(target);
    setChangeStatusOpen(true);
  };

  return (
    <div className="py-10 px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Back button */}
      <div>
        <Link
          to="/cases"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Case register</span>
        </Link>
      </div>

      {/* Header: reference ID (mono, secondary), SUBJECT as serif page title, StatusMark, PriorityMark, SlaPill, escalation note */}
      <header className="space-y-4">
        <div className="space-y-1.5">
          <div className="font-mono text-xs text-[var(--color-text-secondary)] tracking-wider">
            {caseItem.case_reference_id}
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-semibold text-[var(--color-ink)] leading-snug max-w-4xl tracking-tight">
            {caseItem.subject}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <StatusMark status={caseItem.status} />
          <PriorityMark priority={caseItem.priority} />
          <SlaPill dueDate={caseItem.due_date} isResolved={isResolvedOrClosed} />
          {caseItem.escalation_level > 0 && (
            <span className="text-xs text-[var(--color-text-secondary)] font-medium bg-[var(--color-page)] px-2 py-0.5 border border-[var(--color-rule)] rounded-[4px]">
              Escalation level {caseItem.escalation_level}
            </span>
          )}
        </div>

        {/* Full LifecycleStrip directly under header */}
        <div className="pt-3">
          <LifecycleStrip
            currentStatus={caseItem.status}
            dueDate={caseItem.due_date}
            isResolved={isResolvedOrClosed}
            variant="full"
          />
        </div>
      </header>

      {/* Main Two Columns: Left (65% case file), Right (35% action rail). On mobile: action rail first */}
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-[1fr_340px] gap-10 items-start pt-2">
        {/* Left Column: Continuous document with 1px rules between sections */}
        <div className="w-full space-y-8">
          {/* Section 1: Institution plain term/value list */}
          <section className="space-y-4">
            <h2 className="font-serif text-base font-semibold text-[var(--color-ink)] tracking-tight">
              Institution
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-xs">
              <div>
                <dt className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">Name</dt>
                <dd className="font-medium text-[var(--color-text-primary)] mt-1 text-sm">
                  {caseItem.institution_name}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">AICTE ID</dt>
                <dd className="font-mono text-[var(--color-text-secondary)] mt-1">
                  {caseItem.aicte_permanent_id || "—"}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">State</dt>
                <dd className="text-[var(--color-text-primary)] mt-1 font-medium">
                  {instMeta.state}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">District</dt>
                <dd className="text-[var(--color-text-primary)] mt-1 font-medium">
                  {instMeta.district}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">Type</dt>
                <dd className="text-[var(--color-text-primary)] mt-1">
                  {instMeta.type}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">Bureau</dt>
                <dd className="text-[var(--color-text-primary)] mt-1">
                  {caseItem.bureau_name} ({caseItem.bureau_code})
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">Assigned officer</dt>
                <dd className="text-[var(--color-text-primary)] mt-1">
                  {caseItem.assigned_officer_name || "Unassigned"}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">Category</dt>
                <dd className="text-[var(--color-text-primary)] mt-1">
                  {caseItem.category || "General Grievance"}
                </dd>
              </div>
            </dl>
          </section>

          {/* 1px rule divider */}
          <div className="border-t border-[var(--color-rule)]" />

          {/* Section 2: Description and Confidential statement */}
          <section className="space-y-5">
            <h2 className="font-serif text-base font-semibold text-[var(--color-ink)] tracking-tight">
              Description
            </h2>

            <div className="text-xs text-[var(--color-text-primary)] leading-relaxed max-w-3xl whitespace-pre-wrap">
              {caseItem.description_redacted}
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-semibold text-[var(--color-ink)]">
                Confidential statement
              </div>

              {isAuditor ? (
                <RedactionBar />
              ) : caseItem.description_confidential ? (
                <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-page)] border border-[var(--color-rule)] rounded-[6px] p-4 leading-relaxed max-w-3xl whitespace-pre-wrap">
                  {caseItem.description_confidential}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)]">
                  No confidential complainant statement attached to this grievance.
                </p>
              )}
            </div>

            {caseItem.closure_remarks && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-[var(--color-ink)]">
                  Closure remarks
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-page)] border border-[var(--color-rule)] rounded-[6px] p-4 leading-relaxed max-w-3xl">
                  {caseItem.closure_remarks}
                </div>
              </div>
            )}
          </section>

          {/* 1px rule divider */}
          <div className="border-t border-[var(--color-rule)]" />

          {/* Section 3: Tabs "Timeline", "Notes", "Assignment history" */}
          <section className="space-y-4">
            <Tabs defaultValue="timeline" className="w-full">
              <div className="border-b border-[var(--color-rule)]">
                <TabsList className="bg-transparent p-0 h-auto gap-8 border-0">
                  <TabsTrigger
                    value="timeline"
                    className="border-b-2 border-transparent data-[state=active]:border-[var(--color-action)] data-[state=active]:text-[var(--color-ink)] data-[state=active]:shadow-none rounded-none px-1 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-none"
                  >
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="border-b-2 border-transparent data-[state=active]:border-[var(--color-action)] data-[state=active]:text-[var(--color-ink)] data-[state=active]:shadow-none rounded-none px-1 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-none"
                  >
                    Notes
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="border-b-2 border-transparent data-[state=active]:border-[var(--color-action)] data-[state=active]:text-[var(--color-ink)] data-[state=active]:shadow-none rounded-none px-1 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-none"
                  >
                    Assignment history
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="timeline" className="m-0 pt-6 focus-visible:outline-none">
                <AuditTimelineTab caseRef={caseItem.case_reference_id} />
              </TabsContent>

              <TabsContent value="notes" className="m-0 pt-6 focus-visible:outline-none">
                <InternalNotesTab caseRef={caseItem.case_reference_id} />
              </TabsContent>

              <TabsContent value="history" className="m-0 pt-6 focus-visible:outline-none">
                <AssignmentHistoryTab caseRef={caseItem.case_reference_id} />
              </TabsContent>
            </Tabs>
          </section>
        </div>

        {/* Right Column: Sticky Action Rail (1px rule separating from case file, no cards) */}
        <aside className="w-full lg:sticky lg:top-8 lg:border-l border-[var(--color-rule)] lg:pl-8 space-y-5">
          <div className="border-b border-[var(--color-rule)] pb-2.5">
            <h2 className="font-serif text-sm font-semibold text-[var(--color-ink)] tracking-tight">
              Actions
            </h2>
          </div>

          <div className="space-y-2.5">
            {/* Primary button: Change status */}
            <Button
              onClick={() => handleOpenStatusModal()}
              disabled={!canChangeStatus}
              className="w-full bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 h-9 text-xs font-medium rounded-[6px]"
            >
              Change status
            </Button>

            {/* Reassign case button */}
            {canReassign && (
              <Button
                variant="outline"
                onClick={() => setReassignOpen(true)}
                className="w-full text-xs h-8.5 font-normal text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-[var(--color-rule)] bg-surface hover:bg-[var(--color-page)] rounded-[6px]"
              >
                Reassign case
              </Button>
            )}

            {/* Escalate case button */}
            {canEscalate && (
              <Button
                variant="outline"
                onClick={() => setEscalateOpen(true)}
                className="w-full text-xs h-8.5 font-normal text-[var(--sla-overdue-text)] hover:text-[var(--sla-overdue-text)] border-[var(--color-rule)] bg-surface hover:bg-[var(--sla-overdue-bg)]/50 rounded-[6px]"
              >
                Escalate case
              </Button>
            )}

            {/* Reopen case button */}
            {canReopen && (
              <Button
                variant="outline"
                onClick={() => handleOpenStatusModal("In Progress")}
                className="w-full text-xs h-8.5 font-normal text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-[var(--color-rule)] bg-surface hover:bg-[var(--color-page)] rounded-[6px]"
              >
                Reopen case
              </Button>
            )}

            {/* Status notices for special states */}
            {isAuditor && (
              <p className="text-[11px] text-[var(--color-text-muted)] pt-3 leading-relaxed border-t border-[var(--color-rule)]">
                Auditor access is strictly read-only. Status advancement, reassignment, and escalation controls are disabled.
              </p>
            )}

            {isClosed && (
              <p className="text-[11px] text-[var(--color-text-muted)] pt-3 leading-relaxed border-t border-[var(--color-rule)]">
                This case is closed. The lifecycle has terminated and further status transitions are locked.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Action Modals */}
      <ChangeStatusModal
        caseItem={caseItem}
        open={changeStatusOpen}
        onOpenChange={setChangeStatusOpen}
        initialTargetStatus={targetStatusOverride}
      />

      <ReassignModal
        caseItem={caseItem}
        open={reassignOpen}
        onOpenChange={setReassignOpen}
      />

      <EscalateModal
        caseItem={caseItem}
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
      />
    </div>
  );
}
