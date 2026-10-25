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
import { CaseAttachmentsTab } from "./CaseAttachmentsTab";
import { ChangeStatusModal } from "./ChangeStatusModal";
import { ReassignModal } from "./ReassignModal";
import { EscalateModal } from "./EscalateModal";
import { CaseRejectionModal } from "./CaseRejectionModal";
import { CaseReopenModal } from "./CaseReopenModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ChevronLeft,
  Languages,
  FileCheck,
  XCircle,
  RotateCcw,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

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
  const { role, user } = useRole();
  const isAuditor = role === "AUDITOR";

  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [targetStatusOverride, setTargetStatusOverride] = useState<CaseStatus | undefined>(undefined);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);

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

  // Role & Jurisdiction gating
  const isOfficerFromOtherBureau =
    role === "OFFICER" &&
    Boolean(user?.bureau_id) &&
    Boolean(caseItem.bureau_id) &&
    user?.bureau_id !== caseItem.bureau_id;

  const canChangeStatus = !isAuditor && !isClosed && !isOfficerFromOtherBureau && allowedTransitions.length > 0;
  const canReassign = (role === "ADMIN" || role === "SUPERVISOR") && !isClosed;
  const canEscalate = (role === "ADMIN" || role === "SUPERVISOR") && !isClosed && (caseItem.escalation_level ?? 0) < 2;
  const canReject = (role === "ADMIN" || role === "SUPERVISOR") && !isClosed;
  const canReopen = !isAuditor && !isOfficerFromOtherBureau && isResolved;

  // Metadata resolution
  const instMeta = INSTITUTION_METADATA[caseItem.institution_id] || {
    state: "Karnataka",
    district: "Bengaluru",
    type: "Technical Institute",
  };

  const effectiveState = caseItem.institution_state || instMeta.state;
  const effectiveDistrict = caseItem.institution_district || instMeta.district;
  const effectiveType = caseItem.institution_type || instMeta.type;

  const handleOpenStatusModal = (target?: CaseStatus) => {
    setTargetStatusOverride(target);
    setChangeStatusOpen(true);
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-10">
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
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[var(--color-text-secondary)] tracking-wider">
              {caseItem.case_reference_id}
            </span>
            {caseItem.complainant_verification_badge && (
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-[10px] gap-1">
                <ShieldCheck className="h-3 w-3" />
                Verified Student (e-KYC)
              </Badge>
            )}
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
            status={caseItem.status}
            dueDate={caseItem.due_date}
            createdAt={caseItem.created_at}
            variant="full"
          />
        </div>
      </header>

      {/* Officer Cross-Bureau Warning Banner */}
      {isOfficerFromOtherBureau && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-[6px] text-xs text-amber-900 dark:text-amber-200">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">Cross-Bureau Read-Only Mode</p>
            <p className="leading-relaxed">
              This grievance falls under the jurisdiction of{" "}
              <strong>{caseItem.bureau_name} ({caseItem.bureau_code})</strong>.
              You are currently viewing as an officer of{" "}
              <strong>{user?.bureau_name ?? user?.bureau_code}</strong>.
              Under AICTE governance rules, officers cannot modify status or actions for cases outside their assigned bureau.
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Tip: Switch to <strong>Officer ({caseItem.bureau_code})</strong>, <strong>Supervisor</strong>, or <strong>Admin</strong> using the top-bar role switcher to update this case.
            </p>
          </div>
        </div>
      )}

      {/* Main Two Columns: Left (65% case file), Right (35% action rail) */}
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
                  {effectiveState}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">District</dt>
                <dd className="text-[var(--color-text-primary)] mt-1 font-medium">
                  {effectiveDistrict}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">Type</dt>
                <dd className="text-[var(--color-text-primary)] mt-1">
                  {effectiveType}
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

            {/* Bhashini Multilingual Dual View (if vernacular submission) */}
            {caseItem.original_language && caseItem.original_language !== "en" && caseItem.original_description && (
              <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-purple-600" />
                    Original Vernacular Testimony (Section 65B Certified Legal Evidence)
                  </span>
                  <Badge variant="outline" className="text-purple-700 dark:text-purple-300 text-[10px]">
                    Language: {caseItem.original_language.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-purple-950 dark:text-purple-200 font-serif leading-relaxed italic bg-white/60 dark:bg-[#120D22]/60 p-3 rounded-lg border border-purple-100 dark:border-purple-900">
                  &quot;{caseItem.original_description}&quot;
                </div>
                <div className="text-[10px] text-text-secondary flex items-center gap-1">
                  <span>Translation Engine: Digital India Bhashini ULCA NMT • Immutable record locked for ombudsman scrutiny</span>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-wider uppercase">
                Official Redacted Statement (English)
              </div>
              <div className="text-xs text-[var(--color-text-primary)] leading-relaxed max-w-3xl whitespace-pre-wrap">
                {caseItem.description_redacted}
              </div>
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

          {/* Section 3: Tabs "Timeline", "Notes", "Assignment history", "Evidence" */}
          <section className="space-y-4">
            <Tabs defaultValue="timeline" className="w-full">
              <div className="border-b border-[var(--color-rule)] overflow-x-auto">
                <TabsList className="bg-transparent p-0 h-auto gap-4 sm:gap-8 border-0 flex whitespace-nowrap">
                  <TabsTrigger
                    value="timeline"
                    className="border-b-2 border-transparent data-[state=active]:border-[var(--color-action)] data-[state=active]:text-[var(--color-ink)] data-[state=active]:shadow-none rounded-none px-1 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-none"
                  >
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="evidence"
                    className="border-b-2 border-transparent data-[state=active]:border-[var(--color-action)] data-[state=active]:text-[var(--color-ink)] data-[state=active]:shadow-none rounded-none px-1 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-none"
                  >
                    Evidence &amp; Documents
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

              <TabsContent value="evidence" className="m-0 pt-6 focus-visible:outline-none">
                <CaseAttachmentsTab caseRef={caseItem.case_reference_id} />
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

        {/* Right Column: Sticky Action Rail */}
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
                onClick={() => setReopenOpen(true)}
                className="w-full text-xs h-8.5 font-normal text-purple-600 border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 rounded-[6px] gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reopen case
              </Button>
            )}

            {/* Reject spam case button */}
            {canReject && (
              <Button
                variant="outline"
                onClick={() => setRejectOpen(true)}
                className="w-full text-xs h-8.5 font-normal text-red-600 border-red-200 bg-red-50/50 hover:bg-red-100/50 rounded-[6px] gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject as spam / invalid
              </Button>
            )}

            {/* Status notices for special states */}
            {isAuditor && (
              <p className="text-[11px] text-[var(--color-text-muted)] pt-3 leading-relaxed border-t border-[var(--color-rule)]">
                Auditor access is strictly read-only. Status advancement, reassignment, and escalation controls are disabled.
              </p>
            )}

            {isOfficerFromOtherBureau && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-[6px] text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  Jurisdictional Boundary
                </p>
                <p>
                  Status controls are disabled. This grievance belongs to{" "}
                  <strong>{caseItem.bureau_name} ({caseItem.bureau_code})</strong>.
                </p>
              </div>
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

      <CaseRejectionModal
        caseRef={caseItem.case_reference_id}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
      />

      <CaseReopenModal
        caseRef={caseItem.case_reference_id}
        open={reopenOpen}
        onOpenChange={setReopenOpen}
      />
    </div>
  );
}
