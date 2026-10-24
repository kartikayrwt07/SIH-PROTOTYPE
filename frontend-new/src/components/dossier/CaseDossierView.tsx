import React, { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCase } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type { ComplaintCase } from "@/types/ui";
import { StatusChip } from "@/components/cases/StatusChip";
import { SlaPill } from "@/components/cases/SlaPill";
import { PriorityBadge } from "@/components/cases/PriorityBadge";
import { StatusTracker } from "./StatusTracker";
import { ChangeStatusModal } from "./ChangeStatusModal";
import { ReassignModal } from "./ReassignModal";
import { EscalateModal } from "./EscalateModal";
import { AuditTimelineTab } from "./AuditTimelineTab";
import { InternalNotesTab } from "./InternalNotesTab";
import { AssignmentHistoryTab } from "./AssignmentHistoryTab";
import { formatIST } from "@/lib/dateUtils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  Building2,
  Calendar,
  User,
  Shield,
  Lock,
  ArrowRightLeft,
  ShieldAlert,
  GitCommit,
  FileText,
  History,
  AlertCircle,
  Copy,
  Check,
  Tag,
  AlertTriangle,
} from "lucide-react";

interface CaseDossierViewProps {
  caseRef: string;
}

export function CaseDossierView({ caseRef }: CaseDossierViewProps) {
  const router = useRouter();
  const { role, user } = useRole();
  const isAuditor = role === "AUDITOR";
  const isOfficer = role === "OFFICER";

  const [copied, setCopied] = useState(false);
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);

  // Fetch case dossier
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

  const handleCopyRef = () => {
    if (caseItem?.case_reference_id) {
      navigator.clipboard.writeText(caseItem.case_reference_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-6 px-4 space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !caseItem) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-8 bg-card rounded-lg border border-border shadow-2xs space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-base font-semibold text-foreground">Complaint Record Not Found</h2>
          <p className="text-xs text-muted-foreground">
            {(error as Error)?.message || `Case '${caseRef}' could not be retrieved.`}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
              Retry
            </Button>
            <Button asChild size="sm" className="text-xs">
              <Link to="/cases">Return to Case Register</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isResolvedOrClosed = caseItem.status === "Resolved" || caseItem.status === "Closed";
  const isClosed = caseItem.status === "Closed";

  // Role permissions for actions:
  // Auditor cannot perform any mutation (SPEC §5)
  // Officer can change status in own bureau, but cannot reassign or escalate (SPEC §5)
  // Admin & Supervisor can do all 3
  const canChangeStatus = !isAuditor && !isClosed;
  const canReassign = (role === "ADMIN" || role === "SUPERVISOR") && !isClosed;
  const canEscalate = (role === "ADMIN" || role === "SUPERVISOR") && !isClosed && (caseItem.escalation_level ?? 0) < 2;

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link to="/cases" className="hover:text-foreground transition-colors">
          Case Register
        </Link>
        <span>/</span>
        <span className="font-mono text-foreground font-semibold">
          {caseItem.case_reference_id}
        </span>
      </div>

      {/* Dossier Header Card */}
      <div className="bg-card rounded-lg border border-border p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Ref, Status, Priority */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-tight text-primary bg-primary/10 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                {caseItem.case_reference_id}
                <button
                  onClick={handleCopyRef}
                  className="hover:text-foreground transition-colors cursor-pointer"
                  title="Copy reference ID"
                >
                  {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-primary/70" />}
                </button>
              </span>
              <StatusChip status={caseItem.status} />
              <PriorityBadge priority={caseItem.priority} />
              <SlaPill dueDate={caseItem.due_date} isResolved={isResolvedOrClosed} />
              {caseItem.escalation_level > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-red-50 text-red-700 border-red-200 font-semibold gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Tier {caseItem.escalation_level} Escalated
                </Badge>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-snug">
              {caseItem.subject}
            </h1>
          </div>

          {/* Right: Back button */}
          <Button asChild variant="outline" size="sm" className="self-start md:self-auto text-xs h-8 gap-1.5">
            <Link to="/cases">
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back to Register</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Full-width Horizontal Lifecycle Progression Tracker */}
      <StatusTracker currentStatus={caseItem.status} variant="banner" />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 cols): Institution/Category Panel, Description, Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Institution & Jurisdiction Card */}
          <Card className="border-border shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Institutional Intake Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Institution Name</span>
                  <div className="font-semibold text-foreground text-sm">
                    {caseItem.institution_name}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    AICTE Permanent ID: <strong>{caseItem.aicte_permanent_id || "N/A"}</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Bureau Jurisdiction</span>
                  <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span>{caseItem.bureau_name}</span>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    Bureau Code: <strong>{caseItem.bureau_code}</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Complaint Category</span>
                  <div className="font-medium text-foreground flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span>{caseItem.category || "General Technical Education"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Assigned Officer</span>
                  <div className="font-medium text-foreground flex items-center gap-1.5">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>{caseItem.assigned_officer_name ?? "Unassigned (Queue)"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Registration Date</span>
                  <div className="font-medium text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{formatIST(caseItem.created_at)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">SLA Resolution Due</span>
                  <div className="font-medium text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{formatIST(caseItem.due_date)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Redacted Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Public Statement Summary
                </span>
                <div className="text-xs text-foreground bg-muted/40 p-3.5 rounded-md border border-border leading-relaxed">
                  {caseItem.description_redacted}
                </div>
              </div>

              {/* Confidential Description / Auditor Redaction Notice */}
              {isAuditor ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Auditor Redaction Notice</span>
                  </div>
                  <p className="text-[11px] leading-tight text-amber-700">
                    🔒 Confidential Complainant Statement Redacted under Data Governance Policy.
                  </p>
                </div>
              ) : (
                caseItem.description_confidential && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Confidential Complainant Statement
                    </span>
                    <div className="text-xs text-foreground bg-amber-50/50 p-3.5 rounded-md border border-amber-200 leading-relaxed">
                      {caseItem.description_confidential}
                    </div>
                  </div>
                )
              )}

              {/* Closure remarks */}
              {caseItem.closure_remarks && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-green-800 uppercase tracking-wider block">
                    Permanent Closure Record
                  </span>
                  <div className="text-xs text-foreground bg-green-50 p-3.5 rounded-md border border-green-200 leading-relaxed">
                    {caseItem.closure_remarks}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Three Tabs: Audit Timeline, Internal Notes, Assignment History */}
          <div className="bg-card rounded-lg border border-border shadow-2xs overflow-hidden">
            <Tabs defaultValue="timeline" className="w-full">
              <div className="border-b border-border px-4 pt-2 bg-muted/20">
                <TabsList className="bg-transparent p-0 h-auto gap-4">
                  <TabsTrigger
                    value="timeline"
                    className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-2 py-2 text-xs font-semibold gap-1.5"
                  >
                    <GitCommit className="h-3.5 w-3.5" />
                    Audit Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-2 py-2 text-xs font-semibold gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Internal Notes
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-2 py-2 text-xs font-semibold gap-1.5"
                  >
                    <History className="h-3.5 w-3.5" />
                    Assignment History
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="timeline" className="m-0 focus-visible:outline-none">
                <AuditTimelineTab caseRef={caseItem.case_reference_id} />
              </TabsContent>

              <TabsContent value="notes" className="m-0 focus-visible:outline-none">
                <InternalNotesTab caseRef={caseItem.case_reference_id} />
              </TabsContent>

              <TabsContent value="history" className="m-0 focus-visible:outline-none">
                <AssignmentHistoryTab caseRef={caseItem.case_reference_id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Column (1 col, Sticky): Action Controls */}
        <div className="space-y-4 lg:sticky lg:top-4">
          {/* Action Controls Card (Role-Gated) */}
          <Card className="border-border shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Administrative Actions</span>
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                  Role: {role}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {isAuditor ? (
                <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground leading-tight space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Auditor Access Locked</span>
                  </div>
                  <p>Lifecycle state advancement, bureau reassignment, and escalation controls are disabled for independent compliance auditors.</p>
                </div>
              ) : isClosed ? (
                <div className="p-3 bg-slate-100 rounded-md text-xs text-slate-700 leading-tight space-y-1 border border-slate-200">
                  <div className="font-semibold text-slate-900 flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-slate-700" />
                    <span>Case is Formally Closed</span>
                  </div>
                  <p>This complaint has completed its resolution lifecycle and is in a terminal state. Further modifications are locked.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Change Status Button */}
                  <Button
                    onClick={() => setChangeStatusOpen(true)}
                    disabled={!canChangeStatus}
                    className="w-full justify-between text-xs h-9 font-medium"
                  >
                    <span>Change Lifecycle Status</span>
                    <GitCommit className="h-3.5 w-3.5 ml-2" />
                  </Button>

                  {/* Reassign Button (ADMIN / SUPERVISOR) */}
                  <Button
                    onClick={() => setReassignOpen(true)}
                    disabled={!canReassign}
                    variant="outline"
                    className="w-full justify-between text-xs h-9 font-medium"
                  >
                    <span>Reassign Jurisdiction / Officer</span>
                    <ArrowRightLeft className="h-3.5 w-3.5 ml-2" />
                  </Button>

                  {/* Escalate Button (ADMIN / SUPERVISOR) */}
                  <Button
                    onClick={() => setEscalateOpen(true)}
                    disabled={!canEscalate}
                    variant="destructive"
                    className="w-full justify-between text-xs h-9 font-medium"
                  >
                    <span>
                      {caseItem.escalation_level >= 2
                        ? "Maximum Tier 2 Escalated"
                        : "Escalate Surveillance Tier"}
                    </span>
                    <ShieldAlert className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </div>
              )}

              {/* Action Policy Explainer */}
              <div className="pt-2 text-[10px] text-muted-foreground leading-normal border-t border-border/60 space-y-1">
                <div>
                  • <strong>Status changes:</strong> Governed by AICTE state machine guards with mandatory audit remarks.
                </div>
                <div>
                  • <strong>Reassignment:</strong> Logs formal transfer reason and notifies target bureau queue.
                </div>
                <div>
                  • <strong>Escalation:</strong> Elevates surveillance tier (max 2) and triggers supervisory SLA alerts.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Modals */}
      <ChangeStatusModal
        caseItem={caseItem}
        open={changeStatusOpen}
        onOpenChange={setChangeStatusOpen}
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
