import React, { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Sparkles,
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { SAMPLE_CSV_CONTENT, downloadSampleCsv } from "./sampleData";

interface Step1UploadProps {
  csvContent: string;
  onCsvLoaded: (content: string, filename?: string) => void;
  onNext: () => void;
  isLoading: boolean;
}

export function Step1Upload({
  csvContent,
  onCsvLoaded,
  onNext,
  isLoading,
}: Step1UploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setErrorMessage("Please select a valid .csv file.");
      return;
    }

    setErrorMessage(null);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onCsvLoaded(text, file.name);
    };
    reader.onerror = () => {
      setErrorMessage("Error reading CSV file. Please try again.");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleLoadDemoDataset = () => {
    setErrorMessage(null);
    setFileName("aicte_sample_demo_14rows.csv");
    setFileSize("2.8 KB");
    onCsvLoaded(SAMPLE_CSV_CONTENT, "aicte_sample_demo_14rows.csv");
  };

  const lineCount = csvContent ? csvContent.trim().split(/\r?\n/).length - 1 : 0;

  return (
    <div className="space-y-6">
      {/* Informational Guidance Banner */}
      <Card className="border-border bg-card shadow-2xs">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-foreground block">
                Standard Ingestion CSV Schema:
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                institution_aicte_id, bureau_code, subject, category, priority, description, is_confidential
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={downloadSampleCsv}
            className="text-xs h-8 gap-1.5 shrink-0 self-start sm:self-auto hover:border-primary"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Download Sample Template</span>
          </Button>
        </CardContent>
      </Card>

      {/* Drag & Drop Upload Zone */}
      <Card className="border-border shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <span>Upload CSV File</span>
            </CardTitle>

            <button
              type="button"
              onClick={handleLoadDemoDataset}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Load 14-Row Test Dataset (12 valid, 2 invalid)</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv"
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.005]"
                : "border-border hover:border-primary/50 hover:bg-muted/20"
            }`}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Upload className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Drag and drop your complaint CSV file here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse from your computer (.csv format, up to 10 MB)
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Uploaded File Confirmation */}
          {csvContent && (
            <div className="bg-muted/40 border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span>{fileName || "uploaded_data.csv"}</span>
                    {fileSize && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {fileSize}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Ready to validate {Math.max(lineCount, 0)} grievance rows against AICTE institutional rules.
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={onNext}
                disabled={isLoading || !csvContent}
                className="text-xs gap-1.5 shadow-2xs self-start sm:self-auto"
              >
                <span>Proceed to Review & Validate</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
