import React, { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { previewCsv, commitCsv } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type { CsvPreviewResult, CsvCommitResult, CsvRowResult } from "@/types/ui";
import {
  PageHeader,
  DataTable,
  type Column,
  EmptyState,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { SAMPLE_CSV_CONTENT, downloadSampleCsv } from "./sampleData";
import { toast } from "sonner";
import { Check, UploadCloud } from "lucide-react";

export function CsvIngestView() {
  const queryClient = useQueryClient();
  const { role } = useRole();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Role Gate: CSV ingestion is restricted to administrators
  const isAdmin = role === "ADMIN";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvContent, setCsvContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [previewData, setPreviewData] = useState<CsvPreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<CsvCommitResult | null>(null);

  // Preview mutation (Step 1 -> Step 2)
  const previewMutation = useMutation({
    mutationFn: (content: string) => previewCsv(content),
    onSuccess: (data) => {
      setPreviewData(data);
      setStep(2);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to validate CSV file.");
    },
  });

  // Commit mutation (Step 2 -> Step 3)
  const commitMutation = useMutation({
    mutationFn: (rows: CsvPreviewResult["rows"]) => commitCsv(rows),
    onSuccess: (data) => {
      setCommitResult(data);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["slaRadar"] });
      toast.success("Cases registered");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to commit valid rows.");
    },
  });

  const handleFileChange = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || "";
      setCsvContent(text);
      previewMutation.mutate(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleLoadSample = () => {
    setFileName("aicte_sample_demo_14rows.csv");
    setCsvContent(SAMPLE_CSV_CONTENT);
    previewMutation.mutate(SAMPLE_CSV_CONTENT);
  };

  if (!isAdmin) {
    return (
      <div className="py-12 px-6 max-w-xl mx-auto">
        <EmptyState
          message="CSV ingestion is restricted to administrators."
          instruction="Contact your supervisor for access."
        />
      </div>
    );
  }

  // Columns for review table
  const reviewColumns: Column<CsvRowResult>[] = [
    {
      key: "row_number",
      header: "Row #",
      width: "60px",
      align: "right",
      cell: (r) => <span className="tabular-nums text-xs">{r.row_number}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "180px",
      cell: (r) =>
        r.is_valid ? (
          <span className="text-xs font-medium text-[var(--sla-on-track-text)]">Valid</span>
        ) : (
          <span className="text-xs text-[var(--sla-overdue-text)]">
            {r.errors.map((e) => e.message).join("; ")}
          </span>
        ),
    },
    {
      key: "reference",
      header: "Reference",
      width: "120px",
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--color-text-secondary)]">
          {r.institution_aicte_id}
        </span>
      ),
    },
    {
      key: "institution",
      header: "Institution",
      cell: (r) => (
        <span className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-1">
          {r.institution_name}
        </span>
      ),
    },
    {
      key: "bureau",
      header: "Bureau",
      width: "80px",
      cell: (r) => (
        <span className="text-xs text-[var(--color-text-secondary)]">{r.bureau_code}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (r) => (
        <span className="text-xs text-[var(--color-text-secondary)] line-clamp-1">
          {r.category}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      width: "90px",
      cell: (r) => (
        <span className="text-xs text-[var(--color-text-secondary)]">{r.priority}</span>
      ),
    },
  ];

  return (
    <div className="py-10 px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      <PageHeader
        title="CSV ingestion"
        description="Bulk upload complaint cases from institutional registers."
      />

      {/* Ruled Stepper: 1. Upload, 2. Review, 3. Commit */}
      <div className="flex items-center gap-6 py-2.5 border-b border-[var(--color-rule)] text-xs">
        <div
          onClick={() => step > 1 && setStep(1)}
          className={`flex items-center gap-1.5 ${
            step === 1
              ? "font-semibold text-[var(--color-ink)]"
              : step > 1
              ? "text-[var(--color-text-secondary)] cursor-pointer"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          {step > 1 && <Check className="h-3.5 w-3.5 text-[var(--sla-on-track-text)]" />}
          <span>1. Upload</span>
        </div>

        <span className="text-[var(--color-rule)]">/</span>

        <div
          onClick={() => step > 2 && setStep(2)}
          className={`flex items-center gap-1.5 ${
            step === 2
              ? "font-semibold text-[var(--color-ink)]"
              : step > 2
              ? "text-[var(--color-text-secondary)] cursor-pointer"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          {step > 2 && <Check className="h-3.5 w-3.5 text-[var(--sla-on-track-text)]" />}
          <span>2. Review</span>
        </div>

        <span className="text-[var(--color-rule)]">/</span>

        <div
          className={`flex items-center gap-1.5 ${
            step === 3
              ? "font-semibold text-[var(--color-ink)]"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          <span>3. Commit</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-6 max-w-2xl">
          {/* Dashed-border drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--color-rule)] hover:border-[var(--color-action)] bg-surface rounded-[4px] p-10 text-center cursor-pointer transition-colors space-y-2"
          >
            <UploadCloud className="h-8 w-8 text-[var(--color-text-muted)] mx-auto" />
            <div className="font-serif text-sm font-semibold text-[var(--color-ink)]">
              Drop a CSV file here or click to browse
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Supports UTF-8 formatted CSV files up to 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>

          {/* Instructions and Download Template Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)] border-t border-[var(--color-rule)] pt-4">
            <div>
              <span className="font-medium text-[var(--color-text-primary)] block mb-0.5">
                Expected columns:
              </span>
              <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                institution_aicte_id, institution_name, bureau_code, category, priority, subject, description
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="text-xs text-[var(--color-action)] hover:underline"
              >
                Download template CSV
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-[var(--color-text-primary)] hover:underline border border-[var(--color-rule)] px-2.5 py-1 rounded-[4px] bg-surface"
              >
                Load sample dataset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && previewData && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            {/* Summary sentence */}
            <p className="text-xs text-[var(--color-text-secondary)]">
              <span className="font-semibold text-[var(--sla-on-track-text)] tabular-nums">
                {previewData.valid_rows} valid rows
              </span>
              ,{" "}
              <span className="font-semibold text-[var(--sla-overdue-text)] tabular-nums">
                {previewData.invalid_rows} rows with errors
              </span>
              .
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="h-8 text-xs border-[var(--color-rule)] rounded-[6px]"
              >
                Back to upload
              </Button>
              <Button
                size="sm"
                onClick={() => commitMutation.mutate(previewData.rows)}
                disabled={commitMutation.isPending || previewData.valid_rows === 0}
                className="h-8 text-xs font-medium bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 rounded-[6px]"
              >
                {commitMutation.isPending ? "Committing..." : "Commit valid rows"}
              </Button>
            </div>
          </div>

          {/* DataTable of validated rows */}
          <DataTable
            columns={reviewColumns}
            data={previewData.rows}
            keyField={(r) => r.row_number}
            rowClassName={(r) => (!r.is_valid ? "!bg-[#FDECEC]" : "")}
          />
        </div>
      )}

      {/* Step 3: Success State */}
      {step === 3 && commitResult && (
        <div className="space-y-6 max-w-xl">
          <div className="p-6 bg-surface border border-[var(--color-rule)] rounded-[4px] space-y-4">
            <div className="flex items-center gap-2 text-[var(--sla-on-track-text)]">
              <Check className="h-5 w-5" />
              <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">
                {commitResult.imported_count} cases registered successfully
              </h2>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)]">
              Official reference IDs have been allocated and initialised at the Received stage.
            </p>

            {/* List of generated reference IDs in monospace */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-[var(--color-text-muted)] font-medium">
                Allocated reference IDs:
              </div>
              <div className="max-h-48 overflow-y-auto p-3 bg-[var(--color-page)] border border-[var(--color-rule)] rounded-[4px] space-y-1">
                {commitResult.created_case_references.map((ref) => (
                  <div key={ref} className="font-mono text-xs text-[var(--color-text-secondary)]">
                    {ref}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                asChild
                className="h-8 text-xs font-medium bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 rounded-[6px]"
              >
                <Link to="/cases">Open case register</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
