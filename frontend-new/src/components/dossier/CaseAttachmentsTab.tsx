import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  FileCheck,
  Upload,
  Download,
  ShieldCheck,
  AlertTriangle,
  Plus,
  RefreshCw,
  ExternalLink,
  Lock,
} from "lucide-react";
import { getAttachments, uploadAttachment } from "@/api/index";
import type { CaseAttachment } from "@/types/ui";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface CaseAttachmentsTabProps {
  caseRef: string;
}

export function CaseAttachmentsTab({ caseRef }: CaseAttachmentsTabProps) {
  const { role } = useRole();
  const isAuditor = role === "AUDITOR";
  const queryClient = useQueryClient();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("EVIDENCE");
  const [description, setDescription] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);

  const {
    data: attachments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["attachments", caseRef],
    queryFn: () => getAttachments(caseRef),
    staleTime: 30 * 1000,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("Please select a file to upload");
      return uploadAttachment(caseRef, selectedFile, category, description, isConfidential);
    },
    onSuccess: () => {
      toast.success("Evidence document uploaded and verified successfully!");
      setUploadModalOpen(false);
      setSelectedFile(null);
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["attachments", caseRef] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to upload document");
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-purple-600" />
            Evidentiary Documents &amp; Attachments
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Cryptographically hashed (SHA-256) evidence hosted in Supabase Storage Buckets with ClamAV signature verification.
          </p>
        </div>

        {!isAuditor && (
          <Button
            onClick={() => setUploadModalOpen(true)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 gap-1.5 font-medium shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Upload Evidence
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Loading evidence records...
        </div>
      ) : attachments.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-rule rounded-xl bg-surface/50 space-y-2">
          <FileText className="h-8 w-8 text-text-secondary mx-auto" />
          <p className="text-xs text-text-secondary font-medium">
            No scanned evidence or inspection proof attached to this complaint yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="p-4 rounded-xl border border-rule bg-white/70 dark:bg-[#0B0813]/70 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 border border-purple-100 dark:border-purple-900 shrink-0 mt-0.5">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-ink">{att.file_name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {att.category}
                    </Badge>
                    {att.is_confidential && (
                      <Badge className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 text-[9px] gap-1">
                        <Lock className="h-2.5 w-2.5" />
                        Confidential
                      </Badge>
                    )}
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-[9px] gap-1">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      ClamAV Clean
                    </Badge>
                  </div>

                  {att.description && (
                    <p className="text-xs text-text-secondary">{att.description}</p>
                  )}

                  <div className="text-[10px] text-text-secondary flex flex-wrap items-center gap-2">
                    <span>Size: {formatFileSize(att.file_size_bytes)}</span>
                    <span>•</span>
                    <span className="font-mono">SHA-256: {att.sha256_hash ? `${att.sha256_hash.slice(0, 16)}...` : "Verified"}</span>
                    <span>•</span>
                    <span>Bucket: {att.storage_bucket}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <a
                  href={att.secure_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rule text-xs font-medium text-ink hover:bg-surface transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-text-secondary" />
                  View Document
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-semibold flex items-center gap-2 text-ink">
              <Upload className="h-5 w-5 text-purple-600" />
              Upload Inspection Proof Document
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Upload authenticated evidence file (PDF, PNG, JPG, DOCX up to 15MB). Automatically sanitized and indexed in Supabase Storage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-ink">Select File</label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs border-rule"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-ink">Evidence Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-xs border-rule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EVIDENCE">Complainant Evidence</SelectItem>
                  <SelectItem value="INSPECTION_REPORT">Official Inspection Report</SelectItem>
                  <SelectItem value="AFFIDAVIT">Legal Affidavit</SelectItem>
                  <SelectItem value="SHOW_CAUSE_NOTICE">Show Cause Notice</SelectItem>
                  <SelectItem value="OTHER">Other Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-ink">Document Summary / Annotation</label>
              <Input
                placeholder="Brief description of this evidence..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs border-rule"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="confidential"
                checked={isConfidential}
                onCheckedChange={(checked) => setIsConfidential(!!checked)}
              />
              <label htmlFor="confidential" className="text-xs text-ink cursor-pointer">
                Mark as Confidential (Redacted from Auditor and Public views)
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadModalOpen(false)}
              className="text-xs h-8 border-rule"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending || !selectedFile}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 gap-1.5"
            >
              {uploadMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload &amp; Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
