import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { runTriage, checkDuplicates, applyTriage, listCases } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type { TriageResult, DuplicateMatch } from "@/types/ui";
import {
  PageHeader,
  PriorityMark,
  EmptyState,
} from "@/components/shared";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

const PRESET_CASES = [
  {
    label: "Approval Violation (APPR)",
    text: "Institution has unapproved intake capacity in B.Tech Computer Science. Approved intake is 60 students but college enrolled 120 students. Land and building norms violated, faculty ratio is 1:32 without required laboratory infrastructure.",
  },
  {
    label: "Hostel Ragging (STU)",
    text: "Hostel senior students physically harassed first-year students during midnight inspection. Serious ragging incident compromising mental health and safety. Hostel wardens failed to intervene and suppressed student complaints.",
  },
  {
    label: "Faculty 7th CPC (FDC)",
    text: "College management refusing to implement AICTE 7th CPC pay commission scales for teaching faculty. Assistant professors have 7 months salary arrears pending, and provident fund contributions have been deducted but not deposited with EPFO.",
  },
  {
    label: "Capitation Fee (FIN)",
    text: "College demanding 2.5 lakhs mandatory donation and excess tuition fee beyond statutory fee committee limits. College authorities are withholding original marksheets and caution deposit after student requested admission cancellation.",
  },
];

export function SmartTriageView() {
  const queryClient = useQueryClient();
  const { role } = useRole();
  const canApply = role === "ADMIN" || role === "SUPERVISOR";

  const [grievanceText, setGrievanceText] = useState("");
  const [targetCaseRef, setTargetCaseRef] = useState<string>("");
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);

  // Fetch active cases for target case assignment
  const { data: casesData } = useQuery({
    queryKey: ["activeCasesForTriage"],
    queryFn: () => listCases({ page_size: 50 }),
    staleTime: 60 * 1000,
  });

  const availableCases = casesData?.items ?? [];

  // Triage mutation
  const triageMutation = useMutation({
    mutationFn: async (text: string) => {
      const [triageRes, dupRes] = await Promise.all([
        runTriage(text),
        checkDuplicates({
          subject: text.slice(0, 100),
          description: text,
        }),
      ]);
      return { triageRes, dupRes };
    },
    onSuccess: ({ triageRes, dupRes }) => {
      setTriageResult(triageRes);
      setDuplicates(dupRes);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to analyze grievance narrative.");
    },
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!triageResult) return;
      if (targetCaseRef) {
        return applyTriage(targetCaseRef, triageResult);
      }
      return null;
    },
    onSuccess: () => {
      if (targetCaseRef) {
        queryClient.invalidateQueries({ queryKey: ["case", targetCaseRef] });
        queryClient.invalidateQueries({ queryKey: ["cases"] });
      }
      toast.success("Recommendations applied");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to apply recommendations.");
    },
  });

  const handleRunTriage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!grievanceText.trim()) return;
    triageMutation.mutate(grievanceText.trim());
  };

  return (
    <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Smart triage"
        description="Test classification and check for duplicates before registering a case."
      />

      {/* Two columns on desktop: left 55%, right 45% */}
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 items-start">
        {/* Left Column: Input and Classification */}
        <div className="space-y-8">
          {/* 1. Grievance text input */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label htmlFor="grievance-text" className="font-serif text-base font-semibold text-[var(--color-ink)] tracking-tight">
                Grievance narrative
              </Label>

              {/* Preset quick test shortcuts */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[var(--color-text-muted)]">Sample:</span>
                {PRESET_CASES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setGrievanceText(preset.text);
                      triageMutation.mutate(preset.text);
                    }}
                    className="text-[11px] px-2.5 py-1 border border-[var(--color-rule)] bg-surface hover:bg-[var(--color-page)] hover:border-[var(--color-text-muted)] rounded-[4px] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              id="grievance-text"
              placeholder="Paste grievance complaint narrative, institutional allegations, or inspection observations..."
              value={grievanceText}
              onChange={(e) => setGrievanceText(e.target.value)}
              rows={7}
              className="text-xs bg-surface border-[var(--color-rule)] rounded-[6px] leading-relaxed p-3.5 focus-visible:ring-1 focus-visible:ring-[var(--color-action)]"
            />

            <div>
              <Button
                type="button"
                onClick={() => handleRunTriage()}
                disabled={triageMutation.isPending || !grievanceText.trim()}
                className="h-8.5 px-5 text-xs font-medium bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 rounded-[6px]"
              >
                {triageMutation.isPending ? "Analyzing narrative..." : "Run triage"}
              </Button>
            </div>
          </div>

          {/* 2. Classification result */}
          {triageResult && (
            <div className="pt-6 border-t border-[var(--color-rule)] space-y-5">
              <h3 className="font-serif text-base font-semibold text-[var(--color-ink)] tracking-tight">
                Classification result
              </h3>

              <div className="p-5 bg-surface border border-[var(--color-rule)] rounded-[6px] space-y-4">
                {/* Recommended Bureau */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-[var(--color-rule)]">
                  <div>
                    <div className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium mb-1">
                      Recommended bureau
                    </div>
                    <div className="text-base font-semibold text-[var(--color-ink)]">
                      {triageResult.recommended_bureau_name}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-[var(--color-action)] bg-[var(--color-page)] px-2.5 py-1 border border-[var(--color-rule)] rounded-[4px] tabular-nums">
                    {Math.round(triageResult.confidence * 100)}% confidence
                  </div>
                </div>

                {/* Recommended Priority */}
                <div className="space-y-1.5 pb-3 border-b border-[var(--color-rule)]">
                  <div className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
                    Recommended priority
                  </div>
                  <PriorityMark priority={triageResult.recommended_priority} />
                </div>

                {/* Matched Keywords */}
                {triageResult.matched_keywords && triageResult.matched_keywords.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
                      Matched keywords & signals
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {triageResult.matched_keywords.map((kw) => (
                        <span
                          key={kw.keyword}
                          className="text-[11px] px-2.5 py-1 border border-[var(--color-rule)] bg-[var(--color-page)] rounded-[4px] text-[var(--color-text-secondary)]"
                        >
                          <span className="font-medium text-[var(--color-text-primary)]">{kw.keyword}</span>{" "}
                          <span className="font-mono tabular-nums text-[var(--color-text-muted)] ml-1">
                            {Math.round(kw.weight * 100)}%
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Action: Apply recommendations button */}
              {canApply && (
                <div className="pt-4 space-y-3.5">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[var(--color-text-secondary)] block">
                      Target complaint case (optional)
                    </Label>
                    <Select
                      value={targetCaseRef}
                      onValueChange={(val) => setTargetCaseRef(val)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
                        <SelectValue placeholder="Select existing case to update, or apply globally" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" className="text-xs">
                          None (Apply into registration state)
                        </SelectItem>
                        {availableCases.map((c) => (
                          <SelectItem key={c.case_reference_id} value={c.case_reference_id} className="text-xs">
                            {c.case_reference_id} — {c.institution_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    onClick={() => applyMutation.mutate()}
                    disabled={applyMutation.isPending}
                    className="h-8.5 px-4 text-xs font-medium bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 rounded-[6px]"
                  >
                    {applyMutation.isPending ? "Applying..." : "Apply recommendations"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Duplicate Detection */}
        <div className="space-y-4 lg:border-l border-[var(--color-rule)] lg:pl-10">
          <div className="border-b border-[var(--color-rule)] pb-3">
            <h2 className="font-serif text-base font-semibold text-[var(--color-ink)] tracking-tight">
              Potential duplicates
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Automated lexical overlap check across registered cases.
            </p>
          </div>

          {!duplicates || duplicates.length === 0 ? (
            <EmptyState
              title="No similar cases found in the repository."
              instruction="Run triage on a complaint narrative to scan registered records for duplicate allegations."
            />
          ) : (
            <div className="divide-y divide-[var(--color-rule)]">
              {duplicates.map((match) => {
                const simPct = Math.round(match.similarity_score * 100);
                const isHighRisk = simPct > 70;

                return (
                  <div
                    key={match.case_reference_id}
                    onClick={() => window.open(`/cases/${match.case_reference_id}`, "_blank")}
                    className="py-3.5 first:pt-1 last:pb-1 space-y-2 cursor-pointer hover:bg-[var(--color-page)] -mx-2.5 px-2.5 rounded-[4px] transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[var(--color-text-secondary)] font-medium">
                          {match.case_reference_id}
                        </span>
                        <ExternalLink className="h-3 w-3 text-[var(--color-text-muted)]" />
                      </div>
                      <span
                        className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-[4px] ${
                          isHighRisk
                            ? "text-[var(--sla-overdue-text)] bg-[#FDECEC]"
                            : "text-[var(--color-text-secondary)] bg-[var(--color-page)] border border-[var(--color-rule)]"
                        }`}
                      >
                        {simPct}% match
                      </span>
                    </div>

                    <div className="font-serif text-xs font-semibold text-[var(--color-ink)] line-clamp-1">
                      {match.subject}
                    </div>

                    <div className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">
                      {match.institution_name}
                    </div>

                    {match.matched_keywords && match.matched_keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {match.matched_keywords.slice(0, 4).map((kw) => (
                          <span
                            key={kw}
                            className="text-[10px] px-2 py-0.5 bg-[var(--color-page)] border border-[var(--color-rule)] rounded-[2px] text-[var(--color-text-secondary)]"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
