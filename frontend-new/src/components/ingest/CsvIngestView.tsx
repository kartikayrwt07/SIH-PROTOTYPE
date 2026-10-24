import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { previewCsv, commitCsv } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type { CsvPreviewResult, CsvCommitResult } from "@/types/ui";
import { Step1Upload } from "./Step1Upload";
import { Step2Review } from "./Step2Review";
import { Step3Commit } from "./Step3Commit";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileCheck2,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export function CsvIngestView() {
  const queryClient = useQueryClient();
  const { role, user } = useRole();

  // Role Gate: cases:import is restricted to ADMIN
  const canImport = user?.permissions.includes("cases:import") || role === "ADMIN";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvContent, setCsvContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("complaints.csv");
  const [previewData, setPreviewData] = useState<CsvPreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<CsvCommitResult | null>(null);

  // Preview mutation (Step 1 -> Step 2)
  const previewMutation = useMutation({
    mutationFn: (content: string) => previewCsv(content),
    onSuccess: (data) => {
      setPreviewData(data);
      setStep(2);
      toast.success(`Validated ${data.total_rows} rows: ${data.valid_rows} valid, ${data.invalid_rows} invalid.`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to parse and validate CSV content.");
    },
  });

  // Commit mutation (Step 3)
  const commitMutation = useMutation({
    mutationFn: (rows: CsvPreviewResult["rows"]) => commitCsv(rows),
    onSuccess: (data) => {
      setCommitResult(data);
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["slaRadar"] });
      toast.success(`Successfully registered ${data.imported_count} new cases in the AICTE Case Register!`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to commit grievance batch.");
    },
  });

  const handleCsvLoaded = (content: string, name?: string) => {
    setCsvContent(content);
    if (name) setFileName(name);
  };

  const handleProceedToReview = () => {
    if (!csvContent.trim()) return;
    previewMutation.mutate(csvContent);
  };

  const handleProceedToCommitStep = () => {
    setStep(3);
  };

  const handleExecuteCommit = () => {
    if (!previewData?.rows) return;
    commitMutation.mutate(previewData.rows);
  };

  const handleResetWizard = () => {
    setStep(1);
    setCsvContent("");
    setPreviewData(null);
    setCommitResult(null);
  };

  if (!canImport) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="border-border shadow-2xs text-center p-8 space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-foreground">
              Administrator Permissions Required
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Bulk CSV ingestion is restricted to the <strong>ADMIN</strong> role under AICTE regulatory governance policy.
            </p>
          </div>
          <div className="p-3 bg-muted/60 rounded-md text-xs text-muted-foreground max-w-md mx-auto border border-border">
            Please use the <strong>Viewing as</strong> role switcher in the top header bar to switch to <strong>Admin</strong> to test CSV ingestion.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-6 px-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            CSV Ingestion
          </h1>
          <p className="text-xs text-muted-foreground">
            Batch-intake and validate grievance records from CSV files.
          </p>
        </div>
      </div>

      {/* 3-Step Wizard Navigation Stepper */}
      <div className="bg-card border border-border/60 rounded-lg p-2.5 shadow-none">
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 */}
          <div
            onClick={() => step > 1 && setStep(1)}
            className={`flex items-center gap-2.5 p-2 rounded-md transition-colors ${
              step === 1
                ? "bg-muted text-foreground font-semibold"
                : step > 1
                ? "text-foreground font-medium cursor-pointer hover:bg-muted/40"
                : "text-muted-foreground/60"
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium border shrink-0 ${
                step === 1
                  ? "bg-primary text-primary-foreground border-primary"
                  : step > 1
                  ? "bg-muted text-foreground border-border/60"
                  : "bg-background border-border/60 text-muted-foreground/60"
              }`}
            >
              {step > 1 ? <CheckCircle2 className="h-3 w-3 stroke-[2.5]" /> : "1"}
            </div>
            <div className="truncate text-xs">
              <span className="hidden sm:inline">1. </span>Upload
            </div>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => step > 2 && setStep(2)}
            className={`flex items-center gap-2.5 p-2 rounded-md transition-colors ${
              step === 2
                ? "bg-muted text-foreground font-semibold"
                : step > 2
                ? "text-foreground font-medium cursor-pointer hover:bg-muted/40"
                : "text-muted-foreground/60"
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium border shrink-0 ${
                step === 2
                  ? "bg-primary text-primary-foreground border-primary"
                  : step > 2
                  ? "bg-muted text-foreground border-border/60"
                  : "bg-background border-border/60 text-muted-foreground/60"
              }`}
            >
              {step > 2 ? <CheckCircle2 className="h-3 w-3 stroke-[2.5]" /> : "2"}
            </div>
            <div className="truncate text-xs">
              <span className="hidden sm:inline">2. </span>Validate & Review
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-md transition-colors ${
              step === 3
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground/60"
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium border shrink-0 ${
                step === 3
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border/60 text-muted-foreground/60"
              }`}
            >
              3
            </div>
            <div className="truncate text-xs">
              <span className="hidden sm:inline">3. </span>Commit
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <Step1Upload
          csvContent={csvContent}
          onCsvLoaded={handleCsvLoaded}
          onNext={handleProceedToReview}
          isLoading={previewMutation.isPending}
        />
      )}

      {step === 2 && previewData && (
        <Step2Review
          preview={previewData}
          onNext={handleProceedToCommitStep}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && previewData && (
        <Step3Commit
          preview={previewData}
          commitResult={commitResult}
          onCommit={handleExecuteCommit}
          onBack={() => setStep(2)}
          onReset={handleResetWizard}
          isLoading={commitMutation.isPending}
        />
      )}
    </div>
  );
}
