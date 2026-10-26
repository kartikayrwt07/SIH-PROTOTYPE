import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { XCircle, RefreshCw } from "lucide-react";
import { rejectCase } from "@/api/index";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CaseRejectionModalProps {
  caseRef: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CaseRejectionModal({ caseRef, open, onOpenChange }: CaseRejectionModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleReject = async () => {
    if (!reason.trim() || reason.length < 5) {
      toast.error("Please provide a detailed rejection reason (at least 5 characters).");
      return;
    }
    setSubmitting(true);
    try {
      await rejectCase(caseRef, reason);
      toast.success(`Case ${caseRef} rejected and closed.`);
      onOpenChange(false);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["case", caseRef] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["timeline", caseRef] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-semibold flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Reject Malformed or Spam Case
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            Authorized rejection closes case <strong className="font-mono text-ink">{caseRef}</strong> and isolates it
            from Mean Time to Resolve (MTTR) analytics to prevent metric corruption.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label className="text-xs font-medium text-ink">
            Mandatory Rejection Justification:
          </label>
          <Textarea
            rows={3}
            placeholder="Specify why this grievance is invalid, spam, duplicate, or out of AICTE jurisdiction..."
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
            onClick={handleReject}
            disabled={submitting || !reason.trim()}
            className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 gap-1.5"
          >
            {submitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
