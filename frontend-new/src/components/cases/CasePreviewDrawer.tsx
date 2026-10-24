import React from "react";
import { Link } from "@tanstack/react-router";
import type { ComplaintCase } from "@/types/ui";
import { useRole } from "@/contexts/RoleContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusChip } from "./StatusChip";
import { SlaPill } from "./SlaPill";
import { PriorityBadge } from "./PriorityBadge";
import { formatIST } from "@/lib/dateUtils";
import {
  Building2,
  Calendar,
  User,
  Shield,
  Lock,
  ExternalLink,
  Tag,
  AlertTriangle,
} from "lucide-react";

interface CasePreviewDrawerProps {
  caseItem: ComplaintCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CasePreviewDrawer({
  caseItem,
  open,
  onOpenChange,
}: CasePreviewDrawerProps) {
  const { role } = useRole();
  const isAuditor = role === "AUDITOR";

  if (!caseItem) return null;

  const isResolvedOrClosed =
    caseItem.status === "Resolved" || caseItem.status === "Closed";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto flex flex-col justify-between p-6 gap-6"
      >
        <div className="space-y-6">
          {/* Header */}
          <SheetHeader className="space-y-2 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold tracking-tight text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {caseItem.case_reference_id}
              </span>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={caseItem.priority} />
                <StatusChip status={caseItem.status} />
              </div>
            </div>
            <SheetTitle className="text-base font-semibold text-foreground leading-snug">
              {caseItem.subject}
            </SheetTitle>
            <div className="flex items-center gap-2 pt-1">
              <SlaPill
                dueDate={caseItem.due_date}
                isResolved={isResolvedOrClosed}
              />
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
            <SheetDescription className="sr-only">
              Quick preview of case {caseItem.case_reference_id}
            </SheetDescription>
          </SheetHeader>

          <Separator />

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1 font-medium">
                <Building2 className="h-3.5 w-3.5" /> Institution
              </span>
              <div className="font-medium text-foreground leading-tight">
                {caseItem.institution_name}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                AICTE ID: {caseItem.aicte_permanent_id || "N/A"}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1 font-medium">
                <Shield className="h-3.5 w-3.5" /> Bureau Jurisdiction
              </span>
              <div className="font-medium text-foreground leading-tight">
                {caseItem.bureau_name}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                Code: {caseItem.bureau_code}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1 font-medium">
                <Tag className="h-3.5 w-3.5" /> Category
              </span>
              <div className="font-medium text-foreground">
                {caseItem.category || "General"}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5" /> Registered Date
              </span>
              <div className="font-medium text-foreground">
                {formatIST(caseItem.created_at)}
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1 font-medium">
                <User className="h-3.5 w-3.5" /> Assigned Officer
              </span>
              <div className="font-medium text-foreground">
                {caseItem.assigned_officer_name ?? "Unassigned (Pending Allocation)"}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Redacted Public Grievance Summary
            </h4>
            <div className="text-xs leading-relaxed text-foreground bg-muted/40 p-3 rounded-md border border-border">
              {caseItem.description_redacted}
            </div>
          </div>

          {/* Confidential Section */}
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
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Confidential Complainant Statement
                </h4>
                <div className="text-xs leading-relaxed text-foreground bg-amber-50/50 p-3 rounded-md border border-amber-200">
                  {caseItem.description_confidential}
                </div>
              </div>
            )
          )}

          {/* Closure Remarks */}
          {caseItem.closure_remarks && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Final Resolution Remarks
              </h4>
              <div className="text-xs leading-relaxed text-foreground bg-green-50 p-3 rounded-md border border-green-200">
                {caseItem.closure_remarks}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="pt-4 border-t border-border flex flex-row items-center justify-between sm:justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
          <Button
            asChild
            size="sm"
            className="text-xs font-medium gap-1.5"
            onClick={() => onOpenChange(false)}
          >
            <Link to="/cases/$id" params={{ id: caseItem.case_reference_id }}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open Dossier
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
