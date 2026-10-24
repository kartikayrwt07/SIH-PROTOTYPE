import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RotateCcw, RefreshCw } from "lucide-react";
import { reopenCase } from "@/api/index";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CaseReopenModalProps {
  caseRef: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CaseReopenModal({ caseRef, open, onOpenChange }: CaseReopenModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleReopen = async () => {
    if (!reason.trim() || reason.length < 5) {
      toast.error("Please provide a detailed reopening reason (at least 5 characters).");
      return;
    }
    setSubmitting(true);
    try {
      await reopenCase(caseRef, reason);
      toast.success(`Case ${caseRef} reopened to 'In Progress'.`);
      onOpenChange(false);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["case", caseRef] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to reopen complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-semibold flex items-center gap-2 text-ink">
            <RotateCcw className="h-5 w-5 text-purple-600" />
            Reopen Grievance Dossier
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            Reopening case <strong className="font-mono text-ink">{caseRef}</strong> resets its status to{" "}
            <strong>In Progress</strong> and logs an immutable audit event with your formal justification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label className="text-xs font-medium text-ink">
            Mandatory Reopening Justification:
          </label>
          <Textarea
            rows={3}
            placeholder="Explain why this resolved case requires supplementary investigation or ombudsman review..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-xs border-rule resize-none"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 border-rule"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleReopen}
            disabled={submitting || !reason.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 gap-1.5"
          >
            {submitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Confirm Reopen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
