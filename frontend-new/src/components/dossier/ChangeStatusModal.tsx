import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transitionCase } from "@/api/index";
import type { ComplaintCase, CaseStatus } from "@/types/ui";
import { getAllowedTransitions, TRANSITION_GUARD_RULES } from "@/lib/stateMachine";
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
import { StatusChip } from "@/components/cases/StatusChip";
import { toast } from "sonner";
import { AlertCircle, ArrowRight, Loader2, ShieldAlert } from "lucide-react";

interface ChangeStatusModalProps {
  caseItem: ComplaintCase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeStatusModal({
  caseItem,
  open,
  onOpenChange,
}: ChangeStatusModalProps) {
  const queryClient = useQueryClient();
  const allowedNext = getAllowedTransitions(caseItem.status);

  const [toStatus, setToStatus] = useState<CaseStatus | "">(
    allowedNext.length > 0 ? allowedNext[0] : "",
  );
  const [remarks, setRemarks] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: transitionCase,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.case_reference_id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["timeline", caseItem.case_reference_id] });
      toast.success(`Case status advanced to '${updated.status}'`);
      setRemarks("");
      setValidationError(null);
      onOpenChange(false);
    },
    onError: (err: any) => {
      setValidationError(err?.message || "Failed to execute lifecycle transition.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toStatus) {
      setValidationError("Please select a target status.");
      return;
    }
    if (!remarks.trim() || remarks.trim().length < 3) {
      setValidationError("Mandatory remarks must be at least 3 characters long.");
      return;
    }

    setValidationError(null);
    mutation.mutate({
      case_ref: caseItem.case_reference_id,
      to_status: toStatus as CaseStatus,
      remarks: remarks.trim(),
    });
  };

  const guards = toStatus ? TRANSITION_GUARD_RULES[toStatus as CaseStatus] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Advance Case Lifecycle Status</DialogTitle>
            <DialogDescription className="text-xs">
              Execute a formal state transition for case <span className="font-mono font-bold text-foreground">{caseItem.case_reference_id}</span>.
            </DialogDescription>
          </DialogHeader>

          {/* Current State -> Target State */}
          <div className="bg-muted/40 p-3 rounded-lg border border-border flex items-center justify-between text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px] mb-1">Current State</span>
              <StatusChip status={caseItem.status} />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground block text-[11px] mb-1">Target State</span>
              {allowedNext.length === 0 ? (
                <span className="text-xs text-muted-foreground font-semibold">No transitions (Closed)</span>
              ) : (
                <Select
                  value={toStatus}
                  onValueChange={(val) => {
                    setToStatus(val as CaseStatus);
                    setValidationError(null);
                  }}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger className="h-8 w-36 text-xs bg-background">
                    <SelectValue placeholder="Select target" />
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
          </div>

          {/* State Guard Rules */}
          {guards && guards.length > 0 && (
            <div className="text-[11px] bg-blue-50 border border-blue-200 text-blue-900 p-2.5 rounded-md space-y-1">
              <span className="font-semibold flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-blue-700" />
                Transition Guard Enforcement:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                {guards.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mandatory Remarks */}
          <div className="space-y-1.5">
            <Label htmlFor="remarks" className="text-xs font-medium">
              Mandatory Transition Remarks <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="remarks"
              placeholder="State clear official justification for advancing this complaint..."
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (validationError) setValidationError(null);
              }}
              rows={3}
              className="text-xs"
              disabled={mutation.isPending || allowedNext.length === 0}
            />
            <span className="text-[10px] text-muted-foreground">
              Remarks are permanently logged into the immutable audit trail.
            </span>
          </div>

          {/* Inline Error Message */}
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
              size="sm"
              disabled={mutation.isPending || allowedNext.length === 0}
              className="text-xs gap-1.5 font-medium"
            >
              {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Execute Transition</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
