import React, { useState } from "react";
import type { CsvPreviewResult, CsvRowResult } from "@/types/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/cases/PriorityBadge";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Info,
} from "lucide-react";

interface Step2ReviewProps {
  preview: CsvPreviewResult;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Review({ preview, onNext, onBack }: Step2ReviewProps) {
  const [filterMode, setFilterMode] = useState<"ALL" | "VALID" | "INVALID">("ALL");

  const { total_rows, valid_rows, invalid_rows, can_commit, rows } = preview;

  const filteredRows = rows.filter((r) => {
    if (filterMode === "VALID") return r.is_valid;
    if (filterMode === "INVALID") return !r.is_valid;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Rows */}
        <Card className="border border-border/60 shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Total Ingested Rows
            </span>
            <div className="text-2xl font-semibold text-foreground tabular-nums">
              {total_rows}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Processed from submitted CSV batch
            </p>
          </CardContent>
        </Card>

        {/* Valid Rows */}
        <Card className="border border-border/60 shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Valid Rows
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-semibold text-emerald-600 tabular-nums">
              {valid_rows}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Ready for immediate registration
            </p>
          </CardContent>
        </Card>

        {/* Invalid Rows */}
        <Card className="border border-border/60 shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Invalid Rows
              </span>
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-semibold text-rose-600 tabular-nums">
              {invalid_rows}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Violate AICTE schema or registry rules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Banner */}
      <div
        className={`p-4 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          invalid_rows > 0
            ? "bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-200"
            : "bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {invalid_rows > 0 ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          )}
          <div>
            <span className="font-bold block">
              {valid_rows} of {total_rows} rows passed statutory validation.
            </span>
            <span className="text-[11px] opacity-90">
              {invalid_rows > 0
                ? `${invalid_rows} invalid rows will be skipped during commitment. You may proceed with the ${valid_rows} valid rows.`
                : "All records are compliant with AICTE ID patterns and bureau routing rules."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="text-xs h-8 gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Re-upload</span>
          </Button>

          <Button
            size="sm"
            onClick={onNext}
            disabled={!can_commit || valid_rows === 0}
            className="text-xs h-8 gap-1 shadow-2xs"
          >
            <span>Proceed to Commit ({valid_rows} valid)</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Granular Validation Table Card */}
      <Card className="border border-border/60 shadow-none overflow-hidden bg-card">
        <CardHeader className="py-3 px-5 border-b border-border/60 bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span>Row-Level Validation Ledger</span>
            </CardTitle>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-md text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterMode("ALL")}
                className={`px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  filterMode === "ALL"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({total_rows})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("VALID")}
                className={`px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  filterMode === "VALID"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Valid ({valid_rows})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("INVALID")}
                className={`px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  filterMode === "INVALID"
                    ? "bg-red-600 text-white font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Invalid ({invalid_rows})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider w-12">#</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Institution AICTE ID</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Bureau</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Priority</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Subject & Category</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Confidential?</th>
                  <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Validation Errors & Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((row) => (
                  <tr
                    key={row.row_number}
                    className={`transition-colors ${
                      row.is_valid ? "hover:bg-muted/30" : "bg-red-50/20 hover:bg-red-50/30"
                    }`}
                  >
                    {/* Row Number */}
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {row.row_number}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {row.is_valid ? (
                        <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] uppercase font-bold py-0 px-1.5 hover:bg-emerald-100">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                          <span>Valid</span>
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] uppercase font-bold py-0 px-1.5">
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          <span>Invalid</span>
                        </Badge>
                      )}
                    </td>

                    {/* AICTE ID */}
                    <td className="py-3 px-4 font-mono text-xs">
                      <span className={row.is_valid ? "text-foreground font-semibold" : "text-red-600 font-bold"}>
                        {row.institution_aicte_id || "MISSING"}
                      </span>
                    </td>

                    {/* Bureau Code */}
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="font-semibold text-[10px]">
                        {row.bureau_code || "—"}
                      </Badge>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">
                      <PriorityBadge priority={row.priority as any} />
                    </td>

                    {/* Subject & Category */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-foreground line-clamp-1">
                        {row.subject}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {row.category}
                      </span>
                    </td>

                    {/* Confidential? */}
                    <td className="py-3 px-4">
                      {row.is_confidential ? (
                        <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50 border-amber-200">
                          Yes (Lock)
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Public</span>
                      )}
                    </td>

                    {/* Validation Errors */}
                    <td className="py-3 px-4">
                      {row.errors.length > 0 ? (
                        <div className="space-y-1">
                          {row.errors.map((err, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100/90 border border-red-300 px-2 py-0.5 rounded mr-1 mb-1"
                            >
                              <ShieldAlert className="h-3 w-3 shrink-0 text-red-600" />
                              <span>{err.message}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Passed schema checks</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
