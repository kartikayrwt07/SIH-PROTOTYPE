import React, { useState } from "react";
import type { CsvPreviewResult, CsvCommitResult } from "@/types/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  FolderOpen,
  Upload,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface Step3CommitProps {
  preview: CsvPreviewResult;
  commitResult: CsvCommitResult | null;
  onCommit: () => void;
  onBack: () => void;
  onReset: () => void;
  isLoading: boolean;
}

export function Step3Commit({
  preview,
  commitResult,
  onCommit,
  onBack,
  onReset,
  isLoading,
}: Step3CommitProps) {
  const [copied, setCopied] = useState(false);

  const { valid_rows, invalid_rows, total_rows } = preview;

  const handleCopyRefs = () => {
    if (!commitResult?.created_case_references) return;
    const text = commitResult.created_case_references.join(", ");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied all generated reference IDs to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {!commitResult ? (
        /* Pre-Commit Confirmation State */
        <Card className="border border-border/60 shadow-none bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Confirm Grievance Batch Registration</span>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Review batch summary before writing verified records to the permanent AICTE case ledger.
            </p>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Summary Highlights */}
            <div className="bg-muted/40 border border-border rounded-lg p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Batch Registration Summary
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {valid_rows} valid records ready for commitment · {invalid_rows} invalid records will be skipped
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-bold px-2.5 py-1 hover:bg-emerald-100">
                    {valid_rows} Valid
                  </Badge>
                  {invalid_rows > 0 && (
                    <Badge variant="destructive" className="text-xs font-bold px-2.5 py-1">
                      {invalid_rows} Skipped
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Initial Status:</span>
                  <div className="font-semibold text-foreground">Received</div>
                  <span className="text-[11px] text-muted-foreground">Ready for bureau triage</span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Statutory SLA Norm:</span>
                  <div className="font-semibold text-foreground">7 Days</div>
                  <span className="text-[11px] text-muted-foreground">Standard AICTE turnaround</span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Reference ID Format:</span>
                  <div className="font-semibold font-mono text-primary">AICTE-2026-XXXXX</div>
                  <span className="text-[11px] text-muted-foreground">Sequential official intake</span>
                </div>
              </div>
            </div>

            {invalid_rows > 0 && (
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs rounded-lg flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Notice:</strong> The {invalid_rows} invalid rows violating AICTE permanent ID format or bureau jurisdiction will not be created. You can download and correct those rows separately.
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                disabled={isLoading}
                className="text-xs h-8 gap-1.5"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back to Review Table</span>
              </Button>

              <Button
                size="sm"
                onClick={onCommit}
                disabled={isLoading || valid_rows === 0}
                className="text-xs h-8 gap-1.5 shadow-2xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Registering Cases...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Commit {valid_rows} Valid Rows</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Post-Commit Registered State */
        <Card className="border border-border/60 shadow-none overflow-hidden bg-card">
          <div className="bg-emerald-50/40 border-b border-emerald-200/80 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Batch Registration Successful!
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Committed {commitResult.imported_count} grievance records to the active register · {commitResult.skipped_count} invalid rows skipped.
                  </p>
                </div>
              </div>

              {commitResult.created_case_references.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyRefs}
                  className="text-xs h-8 gap-1.5 hover:border-emerald-300 self-start sm:self-auto"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span>{copied ? "Copied All IDs!" : "Copy All Reference IDs"}</span>
                </Button>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Generated Reference IDs Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Official Generated Case Reference IDs ({commitResult.created_case_references.length})
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Click any reference to open its Dossier
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                {commitResult.created_case_references.map((ref) => (
                  <Link
                    key={ref}
                    to={`/cases/${ref}`}
                    className="group bg-card border border-border hover:border-primary/50 hover:bg-primary/5 rounded-md p-2.5 text-xs font-mono font-bold text-primary flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <span>{ref}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Next Steps Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="text-xs h-8 gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Another Batch</span>
              </Button>

              <Button asChild size="sm" className="text-xs h-8 gap-1.5 shadow-2xs">
                <Link to="/cases">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>View Case Register</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
