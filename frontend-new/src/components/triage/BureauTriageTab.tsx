import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { runTriage, listCases, applyTriage } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type { TriageResult, ComplaintCase } from "@/types/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/cases/PriorityBadge";
import { StatusChip } from "@/components/cases/StatusChip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  ShieldCheck,
  Lock,
  ExternalLink,
  HelpCircle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

interface PresetGrievance {
  label: string;
  bureau: string;
  text: string;
}

const PRESET_TEXTS: PresetGrievance[] = [
  {
    label: "Approval Violation (APPR)",
    bureau: "Approval Bureau",
    text: "Institution has unapproved intake capacity in B.Tech Computer Science. Approved intake is 60 students but college enrolled 120 students. Land and building norms violated, faculty ratio is 1:32 without required laboratory infrastructure.",
  },
  {
    label: "Hostel Ragging & Safety (STU)",
    bureau: "Student Welfare Cell",
    text: "Hostel senior students physically harassed first-year students during midnight inspection. Serious ragging incident compromising mental health and safety. Hostel wardens failed to intervene and suppressed student complaints.",
  },
  {
    label: "Faculty 7th CPC Arrears (FDC)",
    bureau: "Faculty Grievance Cell",
    text: "College management refusing to implement AICTE 7th CPC pay commission scales for teaching faculty. Assistant professors have 7 months salary arrears pending, and provident fund contributions have been deducted but not deposited with EPFO.",
  },
  {
    label: "Excess Capitation Fee (FIN)",
    bureau: "Finance & Fee Regulatory Bureau",
    text: "College demanding 2.5 lakhs mandatory donation and excess tuition fee beyond statutory fee committee limits. College authorities are withholding original marksheets and caution deposit after student requested admission cancellation.",
  },
];

export function BureauTriageTab() {
  const queryClient = useQueryClient();
  const { role } = useRole();
  const isPrivileged = role === "ADMIN" || role === "SUPERVISOR";

  const [grievanceText, setGrievanceText] = useState("");
  const [selectedCaseRef, setSelectedCaseRef] = useState<string>("");
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  // Fetch active cases for the "Pick an Existing Case" dropdown
  const { data: casesData } = useQuery({
    queryKey: ["cases", { page: 1, limit: 50 }],
    queryFn: () => listCases({ page: 1, limit: 50 }),
  });

  const availableCases = casesData?.items ?? [];

  // Triage mutation
  const triageMutation = useMutation({
    mutationFn: runTriage,
    onSuccess: (data) => {
      setTriageResult(data);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to classify grievance.");
    },
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: ({ caseRef, result }: { caseRef: string; result: TriageResult }) =>
      applyTriage(caseRef, result),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["case", updated.case_reference_id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["timeline", updated.case_reference_id] });
      toast.success(
        `Applied AI recommendations to ${updated.case_reference_id} (${updated.bureau_code} · ${updated.category}).`,
      );
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to apply triage recommendations.");
    },
  });

  const handleSelectCase = (caseRef: string) => {
    setSelectedCaseRef(caseRef);
    const found = availableCases.find((c) => c.case_reference_id === caseRef);
    if (found) {
      setGrievanceText(`${found.subject}\n\n${found.description_redacted}`);
      triageMutation.mutate(`${found.subject}\n\n${found.description_redacted}`);
    }
  };

  const handleApplyPreset = (preset: PresetGrievance) => {
    setSelectedCaseRef("");
    setGrievanceText(preset.text);
    triageMutation.mutate(preset.text);
  };

  const handleRunAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievanceText.trim()) return;
    triageMutation.mutate(grievanceText.trim());
  };

  const handleCommitTriage = () => {
    if (!selectedCaseRef || !triageResult) return;
    applyMutation.mutate({
      caseRef: selectedCaseRef,
      result: triageResult,
    });
  };

  const confidencePercent = triageResult
    ? Math.round(triageResult.confidence * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Grievance Intake Section */}
      <Card className="border-border shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Intelligent Bureau Classification & Routing
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Classifies raw grievance text using explainable AICTE keyword vectors into Bureau, Category, and Priority.
                </p>
              </div>
            </div>

            {selectedCaseRef && (
              <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
                Linked Case: {selectedCaseRef}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Option A: Select Existing Case */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-muted/20 border border-border/80 p-3 rounded-lg">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Evaluate an Existing Registered Case:</span>
              </label>
              <p className="text-[11px] text-muted-foreground">
                Select an open case to autofill narrative and enable 1-click classification routing.
              </p>
            </div>

            <div>
              <Select
                value={selectedCaseRef}
                onValueChange={(val) => handleSelectCase(val)}
              >
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Choose a registered case..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {availableCases.map((c) => (
                    <SelectItem key={c.case_reference_id} value={c.case_reference_id}>
                      <span className="font-mono font-bold mr-1.5">{c.case_reference_id}</span>
                      <span>· {c.subject.slice(0, 36)}...</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick AICTE Scenario Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Or Test AICTE Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEXTS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-xs font-medium bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border rounded-md px-2.5 py-1 text-left transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Raw Text Input Form */}
          <form onSubmit={handleRunAnalysis} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="triage-text" className="text-xs font-medium">
                Grievance Narrative / Complaint Statement:
              </label>
              <Textarea
                id="triage-text"
                rows={4}
                placeholder="Paste unclassified grievance narrative here or select a case above..."
                value={grievanceText}
                onChange={(e) => {
                  setGrievanceText(e.target.value);
                  setSelectedCaseRef(""); // manual edit detaches case link
                }}
                className="text-xs font-mono text-[11px] resize-y"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                AI evaluation weights keywords across statutory AICTE bureaus with explainable rationales.
              </span>

              <Button
                type="submit"
                size="sm"
                disabled={triageMutation.isPending || !grievanceText.trim()}
                className="text-xs gap-1.5 shadow-2xs"
              >
                {triageMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing Grievance...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Run AI Classification</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Triage Output Section */}
      {triageMutation.isPending ? (
        <Card className="border-border p-8 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Running Multi-Factor Triage Matrix</h4>
            <p className="text-xs text-muted-foreground">
              Mapping complaint entities against AICTE jurisdictional statutes...
            </p>
          </div>
        </Card>
      ) : triageResult ? (
        <Card className="border-primary/40 shadow-2xs overflow-hidden">
          {/* Confidence Meter Header */}
          <div className="bg-primary/5 border-b border-primary/20 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">
                    Classification Recommendation
                  </h3>
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5">
                    {confidencePercent}% High Confidence
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {triageResult.rationale}
                </p>
              </div>

              {/* Apply Action Button */}
              {selectedCaseRef ? (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {isPrivileged ? (
                    <Button
                      size="sm"
                      onClick={handleCommitTriage}
                      disabled={applyMutation.isPending}
                      className="text-xs gap-1.5 shadow-2xs"
                    >
                      {applyMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span>Apply Recommendation</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="text-xs gap-1 opacity-60 cursor-not-allowed"
                      title="Only ADMIN or SUPERVISOR can apply classification recommendations"
                    >
                      <Lock className="h-3 w-3" />
                      <span>Role Locked</span>
                    </Button>
                  )}

                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <Link to={`/cases/${selectedCaseRef}`}>
                      <span>Dossier</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic self-start sm:self-auto">
                  Advisory preview (no case linked)
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-5 space-y-5">
            {/* 3 Classification Output Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bureau */}
              <div className="bg-card border border-border rounded-lg p-3.5 space-y-1 shadow-2xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommended Bureau
                </span>
                <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    {triageResult.recommended_bureau_code} · {triageResult.recommended_bureau_name}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-0.5">
                  AICTE designated supervisory desk
                </p>
              </div>

              {/* Category */}
              <div className="bg-card border border-border rounded-lg p-3.5 space-y-1 shadow-2xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Categorization
                </span>
                <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary shrink-0" />
                  <span>{triageResult.recommended_category}</span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-0.5">
                  Regulatory subject classification
                </p>
              </div>

              {/* Priority */}
              <div className="bg-card border border-border rounded-lg p-3.5 space-y-1 shadow-2xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned Priority
                </span>
                <div className="pt-0.5">
                  <PriorityBadge priority={triageResult.recommended_priority} />
                </div>
                <p className="text-[11px] text-muted-foreground pt-0.5">
                  Normative statutory SLA timeline
                </p>
              </div>
            </div>

            {/* Explainable AI Rationale Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Explainable AI Rationale (Weight Distribution)
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Weights normalized to 100%
                </span>
              </div>

              {triageResult.matched_keywords.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No individual keyword weights matched. Fallback rule applied.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {triageResult.matched_keywords.map((kw, idx) => {
                    const weightPct = Math.round(kw.weight * 100);

                    return (
                      <div
                        key={idx}
                        className="bg-muted/30 border border-border/80 rounded-md p-2.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="font-mono text-[11px] bg-primary/10 text-primary border-primary/20"
                            >
                              #{kw.keyword}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-semibold text-foreground">
                              {kw.resulting_route}
                            </span>
                          </div>

                          <span className="font-mono font-bold text-foreground text-xs tabular-nums">
                            {weightPct}% weight
                          </span>
                        </div>

                        {/* Visual weight bar */}
                        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(weightPct, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty Prompt State */
        <Card className="border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Sparkles className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">Ready for AI Triage</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Choose an active registered case or paste grievance text above to classify bureau jurisdiction and regulatory priority.
          </p>
        </Card>
      )}
    </div>
  );
}
