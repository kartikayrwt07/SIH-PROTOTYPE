import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignCase, listBureaus, listOfficers } from "@/api/index";
import type { ComplaintCase } from "@/types/ui";
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

interface ReassignModalProps {
  caseItem: ComplaintCase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReassignModal({
  caseItem,
  open,
  onOpenChange,
}: ReassignModalProps) {
  const queryClient = useQueryClient();

  const [toBureauId, setToBureauId] = useState<string>(caseItem.bureau_id);
  const [toOfficerId, setToOfficerId] = useState<string>(caseItem.assigned_officer_id ?? "");
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch all bureaus
  const { data: bureaus = [] } = useQuery({
    queryKey: ["bureaus"],
    queryFn: listBureaus,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch officers for selected bureau
  const { data: officers = [], isLoading: isOfficersLoading } = useQuery({
    queryKey: ["officers", toBureauId],
    queryFn: () => listOfficers(toBureauId),
    enabled: !!toBureauId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (caseItem && open) {
      setToBureauId(caseItem.bureau_id);
      setToOfficerId(caseItem.assigned_officer_id ?? "");
      setReason("");
      setValidationError(null);
    }
  }, [caseItem, open]);

  const mutation = useMutation({
    mutationFn: assignCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.case_reference_id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["history", caseItem.case_reference_id] });
      queryClient.invalidateQueries({ queryKey: ["timeline", caseItem.case_reference_id] });
      toast.success("Case reassigned");
      setReason("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      setValidationError(err?.message || "Failed to reassign case.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toBureauId) {
      setValidationError("Please select a target bureau.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setValidationError("Remarks must be at least 3 characters.");
      return;
    }

    setValidationError(null);
    mutation.mutate({
      case_ref: caseItem.case_reference_id,
      to_bureau_id: toBureauId,
      to_officer_id: toOfficerId || undefined,
      reason: reason.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-[8px] p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="p-0 text-left space-y-1">
            <DialogTitle className="font-serif text-base font-semibold text-[var(--color-ink)]">
              Reassign case
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--color-text-secondary)]">
              Reassign bureau jurisdiction or officer for case <span className="font-mono text-[var(--color-text-primary)]">{caseItem.case_reference_id}</span>.
            </DialogDescription>
          </DialogHeader>

          {/* Bureau Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--color-text-primary)]">
              Target bureau
            </Label>
            <Select
              value={toBureauId}
              onValueChange={(val) => {
                setToBureauId(val);
                setToOfficerId("");
                if (validationError) setValidationError(null);
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
                <SelectValue placeholder="Select target bureau" />
              </SelectTrigger>
              <SelectContent>
                {bureaus.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Officer Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--color-text-primary)]">
              Assigned officer (optional)
            </Label>
            <Select
              value={toOfficerId}
              onValueChange={(val) => setToOfficerId(val)}
              disabled={isOfficersLoading || officers.length === 0}
            >
              <SelectTrigger className="h-8 text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
                <SelectValue placeholder={isOfficersLoading ? "Loading officers..." : "Leave unassigned"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="text-xs">
                  Unassigned
                </SelectItem>
                {officers.map((off) => (
                  <SelectItem key={off.id} value={off.id} className="text-xs">
                    {off.full_name} ({off.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Remarks textarea */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="reassign-reason" className="text-xs font-medium text-[var(--color-text-primary)]">
                Remarks
              </Label>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Required for the audit trail
              </span>
            </div>
            <Textarea
              id="reassign-reason"
              placeholder="State the jurisdictional justification for this transfer..."
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
              disabled={mutation.isPending || !toBureauId}
              className="h-8 text-xs font-medium bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 rounded-[6px]"
            >
              {mutation.isPending ? "Reassigning..." : "Reassign case"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
