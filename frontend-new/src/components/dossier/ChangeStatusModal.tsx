import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transitionCase } from "@/api/index";
import type { ComplaintCase, CaseStatus } from "@/types/ui";
import { getAllowedTransitions } from "@/lib/stateMachine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ChangeStatusModalProps {
  caseItem: ComplaintCase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTargetStatus?: CaseStatus;
}

export function ChangeStatusModal({
  caseItem,
  open,
  onOpenChange,
  initialTargetStatus,
}: ChangeStatusModalProps) {
  const queryClient = useQueryClient();
  const allowedNext = getAllowedTransitions(caseItem.status);

  const [toStatus, setToStatus] = useState<CaseStatus | "">(
    initialTargetStatus && allowedNext.includes(initialTargetStatus)
      ? initialTargetStatus
      : allowedNext.length > 0
      ? allowedNext[0]
      : "",
  );
  const [remarks, setRemarks] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const valid = getAllowedTransitions(caseItem.status);
      if (initialTargetStatus && valid.includes(initialTargetStatus)) {
        setToStatus(initialTargetStatus);
      } else if (valid.length > 0) {
        setToStatus(valid[0]);
      } else {
        setToStatus("");
      }
      setRemarks("");
      setValidationError(null);
    }
  }, [open, caseItem.status, initialTargetStatus]);

  const mutation = useMutation({
    mutationFn: transitionCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.case_reference_id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["timeline", caseItem.case_reference_id] });
      toast.success("Status changed");
      setRemarks("");
      setValidationError(null);
      onOpenChange(false);
    },
    onError: (err: any) => {
      setValidationError(err?.message || "Failed to change status.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toStatus) {
      setValidationError("Please select a target status.");
      return;
    }
    if (!remarks.trim() || remarks.trim().length < 3) {
      setValidationError("Remarks must be at least 3 characters.");
      return;
    }

    setValidationError(null);
    mutation.mutate({
      case_ref: caseItem.case_reference_id,
      to_status: toStatus as CaseStatus,
      remarks: remarks.trim(),
    });
  };

  const modalTitle = toStatus ? `Change status to ${toStatus}` : "Change status";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-[8px] p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="p-0 text-left space-y-1">
            <DialogTitle className="font-serif text-base font-semibold text-[var(--color-ink)]">
              {modalTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--color-text-secondary)]">
              Case <span className="font-mono text-[var(--color-text-primary)]">{caseItem.case_reference_id}</span> is currently at stage{" "}
              <strong className="text-[var(--color-text-primary)]">{caseItem.status}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Target Status Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--color-text-primary)]">
              Next stage
            </Label>
            {allowedNext.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                No further valid stage transitions available from {caseItem.status}.
              </p>
            ) : (
              <Select
                value={toStatus}
                onValueChange={(val) => {
                  setToStatus(val as CaseStatus);
                  setValidationError(null);
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
                  <SelectValue placeholder="Select target status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedNext.map((st) => (
                    <SelectItem key={st} value={st} className="text-xs">
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Remarks textarea */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="status-remarks" className="text-xs font-medium text-[var(--color-text-primary)]">
                Remarks
              </Label>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Required for the audit trail
              </span>
            </div>
            <Textarea
              id="status-remarks"
              placeholder="State the justification or procedural basis for this status change..."
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (validationError) setValidationError(null);
              }}
              rows={3}
              className="text-xs bg-surface border-[var(--color-rule)] rounded-[6px]"
            />
            {validationError && (
              <p className="text-xs text-[var(--sla-overdue-text)]">{validationError}</p>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-[var(--color-rule)] gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs border-[var(--color-rule)] rounded-[6px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending || !toStatus || allowedNext.length === 0}
              className="h-8 text-xs font-medium bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 rounded-[6px]"
            >
              {mutation.isPending ? "Updating..." : "Change status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
