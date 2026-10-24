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
import { AlertCircle, Loader2 } from "lucide-react";

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
    if (caseItem) {
      setToBureauId(caseItem.bureau_id);
      setToOfficerId(caseItem.assigned_officer_id ?? "");
      setReason("");
      setValidationError(null);
    }
  }, [caseItem, open]);

  const mutation = useMutation({
    mutationFn: assignCase,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.case_reference_id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["history", caseItem.case_reference_id] });
      queryClient.invalidateQueries({ queryKey: ["timeline", caseItem.case_reference_id] });
      toast.success(`Case transferred to ${updated.bureau_name}`);
      setReason("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      setValidationError(err?.message || "Failed to transfer bureau jurisdiction.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toBureauId) {
      setValidationError("Please select a target bureau.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setValidationError("Mandatory transfer reason must be at least 3 characters long.");
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Reassign Case Jurisdiction & Officer</DialogTitle>
            <DialogDescription className="text-xs">
              Transfer case <span className="font-mono font-bold text-foreground">{caseItem.case_reference_id}</span> to another bureau or allocate to an officer.
            </DialogDescription>
          </DialogHeader>

          {/* Target Bureau */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Target Bureau Jurisdiction</Label>
            <Select
              value={toBureauId}
              onValueChange={(val) => {
                setToBureauId(val);
                setToOfficerId(""); // reset officer when bureau changes
                if (validationError) setValidationError(null);
              }}
              disabled={mutation.isPending}
            >
              <SelectTrigger className="text-xs h-9 bg-background">
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

          {/* Target Officer */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Assign Officer (Optional)</Label>
            <Select
              value={toOfficerId || "NONE"}
              onValueChange={(val) => {
                setToOfficerId(val === "NONE" ? "" : val);
              }}
              disabled={mutation.isPending || isOfficersLoading || officers.length === 0}
            >
              <SelectTrigger className="text-xs h-9 bg-background">
                <SelectValue placeholder={isOfficersLoading ? "Loading officers..." : "Unassigned"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE" className="text-xs">Unassigned (Pool Queue)</SelectItem>
                {officers.map((off) => (
                  <SelectItem key={off.id} value={off.id} className="text-xs">
                    {off.full_name} ({off.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transfer Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-medium">
              Mandatory Transfer Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain jurisdiction or subject-matter justification for transfer..."
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

          {/* Validation error */}
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
              disabled={mutation.isPending}
              className="text-xs gap-1.5 font-medium"
            >
              {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Confirm Reassignment</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
