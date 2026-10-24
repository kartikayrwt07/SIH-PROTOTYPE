import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { escalateCase } from "@/api/index";
import type { ComplaintCase } from "@/types/ui";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertCircle, AlertTriangle, ArrowRight, Loader2, ShieldAlert } from "lucide-react";

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

  const mutation = useMutation({
    mutationFn: escalateCase,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.case_reference_id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["timeline", caseItem.case_reference_id] });
      queryClient.invalidateQueries({ queryKey: ["slaRadar"] });
      toast.success(`Case escalated to Tier ${updated.escalation_level} surveillance.`);
      setReason("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      setValidationError(err?.message || "Failed to escalate complaint.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaxTier) {
      setValidationError("This case is already at maximum escalation Tier 2.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setValidationError("Mandatory escalation reason must be at least 3 characters long.");
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <span>Escalate Supervisory Surveillance</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Advance surveillance tier for case <span className="font-mono font-bold text-foreground">{caseItem.case_reference_id}</span>.
            </DialogDescription>
          </DialogHeader>

          {/* Current Tier vs Next Tier */}
          <div className="bg-red-50/50 border border-red-200/80 p-3 rounded-lg flex items-center justify-between text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px] mb-1">Current Tier</span>
              <Badge variant="outline" className="text-xs font-semibold bg-background">
                {currentTier === 0 ? "Normal (Tier 0)" : `Tier ${currentTier} Surveillance`}
              </Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-red-400" />
            <div>
              <span className="text-muted-foreground block text-[11px] mb-1">Target Tier</span>
              {isMaxTier ? (
                <Badge variant="destructive" className="text-xs">
                  Max Tier 2 Reached
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  Tier {nextTier} Supervisory Alert
                </Badge>
              )}
            </div>
          </div>

          {isMaxTier ? (
            <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground">
              This case has already reached the maximum supervisory tier (Tier 2: Overdue / Emergency Surveillance). Further tier advancement is locked.
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="escalate-reason" className="text-xs font-medium">
                Mandatory Escalation Justification <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="escalate-reason"
                placeholder="State why this grievance requires elevated supervisory oversight (e.g. repeated SLA breach, high institutional impact)..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                rows={3}
                className="text-xs"
                disabled={mutation.isPending}
              />
            </div>
          )}

          {validationError && (
            <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={mutation.isPending || isMaxTier}
              className="text-xs gap-1.5 font-medium"
            >
              {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Confirm Escalation</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
