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
    <div className="py-6 px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Smart triage"
        description="Test classification and check for duplicates before registering a case."
      />

      {/* Two columns on desktop: left 55%, right 45% */}
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 items-start">
        {/* Left Column: Input and Classification */}
        <div className="space-y-6">
          {/* 1. Grievance text input */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="grievance-text" className="font-serif text-base font-semibold text-[var(--color-ink)]">
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
                    className="text-[11px] px-2 py-0.5 border border-[var(--color-rule)] bg-surface hover:bg-[var(--color-page)] rounded-[4px] text-[var(--color-text-secondary)] transition-none"
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
              rows={6}
              className="text-xs bg-surface border-[var(--color-rule)] rounded-[6px] leading-relaxed"
            />

            <div>
              <Button
                type="button"
                onClick={() => handleRunTriage()}
                disabled={triageMutation.isPending || !grievanceText.trim()}
                className="h-8 px-4 text-xs font-medium bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 rounded-[6px]"
              >
                {triageMutation.isPending ? "Analyzing..." : "Run triage"}
              </Button>
            </div>
          </div>

          {/* 2. Classification result */}
          {triageResult && (
            <div className="pt-4 border-t border-[var(--color-rule)] space-y-4">
              <h3 className="font-serif text-sm font-semibold text-[var(--color-ink)]">
                Classification result
              </h3>

              <div className="space-y-3 text-xs">
                {/* Recommended Bureau */}
                <div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mb-0.5">Recommended bureau</div>
                  <div className="text-base font-semibold text-[var(--color-ink)]">
                    {triageResult.recommended_bureau_name}{" "}
                    <span className="text-xs font-normal text-[var(--color-text-secondary)]">
                      · {Math.round(triageResult.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>

                {/* Recommended Priority */}
                <div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mb-1">Recommended priority</div>
                  <PriorityMark priority={triageResult.recommended_priority} />
                </div>

                {/* Matched Keywords */}
                {triageResult.matched_keywords && triageResult.matched_keywords.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-[var(--color-text-muted)]">Matched keywords</div>
                    <div className="flex flex-wrap gap-1.5">
                      {triageResult.matched_keywords.map((kw) => (
                        <span
                          key={kw.keyword}
                          className="text-[11px] px-2 py-0.5 border border-[var(--color-rule)] bg-[var(--color-page)] rounded-[4px] text-[var(--color-text-secondary)]"
                        >
                          {kw.keyword}{" "}
                          <span className="font-mono tabular-nums text-[var(--color-text-muted)]">
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
                <div className="pt-4 border-t border-[var(--color-rule)] space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[var(--color-text-muted)] block">
                      Target complaint case (optional)
                    </Label>
                    <Select
                      value={targetCaseRef}
                      onValueChange={(val) => setTargetCaseRef(val)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
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
                    className="h-8 text-xs font-medium bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 rounded-[6px]"
                  >
                    {applyMutation.isPending ? "Applying..." : "Apply recommendations"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Duplicate Detection */}
        <div className="space-y-4 lg:border-l border-[var(--color-rule)] lg:pl-8">
          <div className="border-b border-[var(--color-rule)] pb-2">
            <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">
              Potential duplicates
            </h2>
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
                    className="py-3 first:pt-0 last:pb-0 space-y-1.5 cursor-pointer hover:bg-[var(--color-page)] -mx-2 px-2 rounded transition-none"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                          {match.case_reference_id}
                        </span>
                        <ExternalLink className="h-3 w-3 text-[var(--color-text-muted)]" />
                      </div>
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          isHighRisk
                            ? "text-[var(--sla-overdue-text)]"
                            : "text-[var(--color-text-secondary)]"
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
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {match.matched_keywords.slice(0, 4).map((kw) => (
                          <span
                            key={kw}
                            className="text-[10px] px-1.5 py-0.5 bg-[var(--color-page)] border border-[var(--color-rule)] rounded-[2px] text-[var(--color-text-secondary)]"
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
