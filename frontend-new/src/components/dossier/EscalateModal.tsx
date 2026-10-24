import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { escalateCase } from "@/api/index";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EscalateModalProps {
  caseItem: { case_reference_id: string; escalation_level?: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EscalateModal({
  caseItem,
  open,
  onOpenChange,
}: EscalateModalProps) {
  const queryClient = useQueryClient();
  const currentTier = caseItem.escalation_level ?? 0;
  const isMaxTier = currentTier >= 2;
  const nextTier = Math.min(currentTier + 1, 2);

  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setValidationError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: escalateCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.case_reference_id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["timeline", caseItem.case_reference_id] });
      queryClient.invalidateQueries({ queryKey: ["slaRadar"] });
      toast.success("Case escalated");
      setReason("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      setValidationError(err?.message || "Failed to escalate case.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaxTier) {
      setValidationError("This case is already at maximum escalation level 2.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setValidationError("Remarks must be at least 3 characters.");
      return;
    }

    setValidationError(null);
    mutation.mutate({
      case_ref: caseItem.case_reference_id,
      reason: reason.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-[8px] p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="p-0 text-left space-y-1">
            <DialogTitle className="font-serif text-base font-semibold text-[var(--color-ink)]">
              Escalate case to level {nextTier}
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--color-text-secondary)]">
              Case <span className="font-mono text-[var(--color-text-primary)]">{caseItem.case_reference_id}</span> is currently at escalation level {currentTier}.
            </DialogDescription>
          </DialogHeader>

          {/* Remarks textarea */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="escalate-reason" className="text-xs font-medium text-[var(--color-text-primary)]">
                Remarks
              </Label>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Required for the audit trail
              </span>
            </div>
            <Textarea
              id="escalate-reason"
              placeholder="State the justification for elevating supervisory surveillance..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
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
              disabled={mutation.isPending || isMaxTier}
              className="h-8 text-xs font-medium bg-[var(--sla-overdue-text)] text-white hover:bg-[var(--sla-overdue-text)]/90 rounded-[6px]"
            >
              {mutation.isPending ? "Escalating..." : "Escalate case"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
