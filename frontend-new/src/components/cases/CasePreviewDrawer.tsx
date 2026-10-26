import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { ComplaintCase } from "@/types/ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlaPill } from "@/components/shared/SlaPill";
import { StatusMark } from "@/components/shared/StatusMark";
import { PriorityMark } from "@/components/shared/PriorityMark";
import { formatIST } from "@/lib/dateUtils";
import { useRole } from "@/contexts/RoleContext";
import { CaseRejectionModal } from "@/components/dossier/CaseRejectionModal";
import { XCircle } from "lucide-react";

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
  const { role, user } = useRole();
  const [rejectOpen, setRejectOpen] = useState(false);

  if (!caseItem) return null;

  const isResolvedOrClosed =
    caseItem.status === "Resolved" || caseItem.status === "Closed" || caseItem.status === "Rejected";
  const isAuditor = role === "AUDITOR";
  const isOfficerFromOtherBureau =
    role === "OFFICER" &&
    Boolean(user?.bureau_id) &&
    Boolean(caseItem.bureau_id) &&
    user?.bureau_id !== caseItem.bureau_id;
  const isClosed = caseItem.status === "Closed" || caseItem.status === "Rejected";
  const canReject = !isAuditor && !isClosed && !isOfficerFromOtherBureau;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-white/95 dark:bg-[#07050E]/95 backdrop-blur-xl border-l border-[#ECE6F4] dark:border-[#201533] rounded-l-[12px] shadow-[0_8px_32px_rgba(112,82,200,0.12)] p-6 flex flex-col justify-between overflow-y-auto"
      >
        <div className="space-y-5">
          {/* Header */}
          <SheetHeader className="space-y-2 text-left p-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                {caseItem.case_reference_id}
              </span>
              <div className="flex items-center gap-3">
                <PriorityMark priority={caseItem.priority} />
                <StatusMark status={caseItem.status} />
              </div>
            </div>

            <SheetTitle className="font-serif text-lg font-semibold text-[var(--color-ink)] leading-snug pt-1">
              {caseItem.subject}
            </SheetTitle>

            <SheetDescription className="sr-only">
              Quick preview of case {caseItem.case_reference_id}
            </SheetDescription>

            <div className="pt-1">
              <SlaPill
                dueDate={caseItem.due_date}
                isResolved={isResolvedOrClosed}
              />
            </div>
          </SheetHeader>

          {/* Ruled separator */}
          <div className="border-t border-[var(--color-rule)]" />

          {/* Details list */}
          <dl className="space-y-3.5 text-xs">
            <div>
              <dt className="text-[var(--color-text-muted)] text-[11px] mb-0.5">Institution</dt>
              <dd className="font-medium text-[var(--color-text-primary)]">
                {caseItem.institution_name}
              </dd>
              {caseItem.aicte_permanent_id && (
                <dd className="font-mono text-[10px] text-[var(--color-text-muted)]">
                  Permanent ID: {caseItem.aicte_permanent_id}
                </dd>
              )}
            </div>

            <div>
              <dt className="text-[var(--color-text-muted)] text-[11px] mb-0.5">Bureau</dt>
              <dd className="text-[var(--color-text-primary)] font-medium">
                {caseItem.bureau_name} ({caseItem.bureau_code})
              </dd>
            </div>

            <div>
              <dt className="text-[var(--color-text-muted)] text-[11px] mb-0.5">Category</dt>
              <dd className="text-[var(--color-text-primary)]">
                {caseItem.category || "General Grievance"}
              </dd>
            </div>

            <div>
              <dt className="text-[var(--color-text-muted)] text-[11px] mb-0.5">Created date</dt>
              <dd className="font-mono text-[var(--color-text-secondary)] tabular-nums">
                {formatIST(caseItem.created_at)}
              </dd>
            </div>

            {caseItem.assigned_officer_name && (
              <div>
                <dt className="text-[var(--color-text-muted)] text-[11px] mb-0.5">Assigned officer</dt>
                <dd className="text-[var(--color-text-primary)]">
                  {caseItem.assigned_officer_name}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Footer with primary action */}
        <div className="pt-6 border-t border-[var(--color-rule)] mt-6 space-y-2">
          <Button
            asChild
            className="w-full bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 h-9 text-xs font-medium rounded-[6px]"
          >
            <Link
              to="/cases/$id"
              params={{ id: caseItem.case_reference_id }}
              onClick={() => onOpenChange(false)}
            >
              Open case file
            </Link>
          </Button>

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
        </div>
      </SheetContent>

      <CaseRejectionModal
        caseRef={caseItem.case_reference_id}
        open={rejectOpen}
        onOpenChange={(isOpen) => {
          setRejectOpen(isOpen);
          if (!isOpen && caseItem.status === "Rejected") {
            onOpenChange(false);
          }
        }}
      />
    </Sheet>
  );
}
