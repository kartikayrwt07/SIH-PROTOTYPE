import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { checkDuplicates } from "@/api/index";
import type { DuplicateMatch } from "@/types/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/cases/StatusChip";
import { CompareModal } from "./CompareModal";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  GitCompare,
  Search,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  FileText,
  ArrowRight,
} from "lucide-react";

interface TestScenario {
  label: string;
  subject: string;
  description: string;
  institution_name: string;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    label: "Scenario 1: Faculty Ratio Violation",
    subject: "Acute faculty shortage below AICTE prescribed norm",
    description: "Institution has 42 faculty against required 65 for enrolled students. Faculty-student ratio is 1:29 violating AICTE approval norms.",
    institution_name: "Lovely Professional University",
  },
  {
    label: "Scenario 2: Hostel Ragging & Safety",
    subject: "Severe ragging incident in boys hostel block",
    description: "First-year engineering students subjected to mental harassment and physical bullying by senior hostel residents. Wardens unresponsive.",
    institution_name: "Birla Institute of Technology, Mesra",
  },
  {
    label: "Scenario 3: Unpaid Salary & Arrears",
    subject: "7th CPC pay scale non-implementation and delayed salary",
    description: "Assistant professors not paid revised salaries according to AICTE 7th CPC guidelines. 5 months salary arrears pending.",
    institution_name: "Amity University, Noida",
  },
  {
    label: "Scenario 4: Capitation Fee Demand",
    subject: "Excess capitation fee and refusal to refund caution deposit",
    description: "College demanded 1.5 lakhs excess capitation fee during admission and withholding original 10th/12th marksheets upon withdrawal.",
    institution_name: "Vellore Institute of Technology",
  },
];

export function DuplicateCheckTab() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [matches, setMatches] = useState<DuplicateMatch[] | null>(null);
  const [activeCompareMatch, setActiveCompareMatch] = useState<DuplicateMatch | null>(null);

  const mutation = useMutation({
    mutationFn: checkDuplicates,
    onSuccess: (data) => {
      setMatches(data);
    },
  });

  const handleRunCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() && !description.trim()) return;

    mutation.mutate({
      subject: subject.trim(),
      description: description.trim(),
      institution_name: institutionName.trim() || undefined,
    });
  };

  const handleApplyScenario = (sc: TestScenario) => {
    setSubject(sc.subject);
    setDescription(sc.description);
    setInstitutionName(sc.institution_name);
    // Auto-run for rapid Hackathon demo evaluation
    mutation.mutate({
      subject: sc.subject,
      description: sc.description,
      institution_name: sc.institution_name,
    });
  };

  const handleReset = () => {
    setSubject("");
    setDescription("");
    setInstitutionName("");
    setMatches(null);
  };

  return (
    <div className="space-y-6">
      {/* Input Section Card */}
      <Card className="border-border shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Duplicate Grievance Intelligence
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Scan incoming complaints against registered repository cases using semantic token overlap.
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs h-7 text-muted-foreground hover:text-foreground self-start sm:self-auto"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset Form
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Quick Demo Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Demo Presets (Click to autofill & scan):
            </span>
            <div className="flex flex-wrap gap-2">
              {TEST_SCENARIOS.map((sc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyScenario(sc)}
                  className="text-xs font-medium bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border rounded-md px-2.5 py-1 text-left transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span>{sc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRunCheck} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dup-subject" className="text-xs font-medium">
                  Complaint Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dup-subject"
                  placeholder="e.g. Faculty shortage and salary arrears violation"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dup-institution" className="text-xs font-medium">
                  Institution Name (Optional affinity boost)
                </Label>
                <Input
                  id="dup-institution"
                  placeholder="e.g. Lovely Professional University"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dup-description" className="text-xs font-medium">
                Grievance Narrative / Statement <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="dup-description"
                placeholder="Paste the grievance body or student/faculty complaint narrative here..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs font-mono text-[11px] resize-y"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                Matches are evaluated using weighted Jaccard similarity and institutional correlation.
              </span>

              <Button
                type="submit"
                size="sm"
                disabled={mutation.isPending || (!subject.trim() && !description.trim())}
                className="text-xs gap-1.5 shadow-2xs"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing Repository...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Run Duplicate Check</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {mutation.isPending ? (
        <Card className="border-border p-8 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Scanning 58 Case Repository Records</h4>
            <p className="text-xs text-muted-foreground">
              Extracting semantic tokens and computing cross-case similarity scores...
            </p>
          </div>
        </Card>
      ) : matches !== null ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Potential Duplicate Records
              </h3>
              <Badge variant="outline" className="text-xs">
                {matches.length} {matches.length === 1 ? "match found" : "matches found"}
              </Badge>
            </div>

            <span className="text-xs text-muted-foreground">
              Ranked by similarity percentage
            </span>
          </div>

          {matches.length === 0 ? (
            <Card className="border-border p-8 text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold">Zero Duplicate Matches Found</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No existing registered grievances match this submission above the 20% similarity threshold. This appears to be a unique grievance.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {matches.map((item) => {
                const percent = Math.round(item.similarity_score * 100);
                const isHigh = percent >= 70;
                const isModerate = percent >= 45 && percent < 70;

                return (
                  <Card
                    key={item.case_reference_id}
                    className="border-border hover:border-primary/40 transition-colors shadow-2xs overflow-hidden"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/cases/${item.case_reference_id}`}
                            className="font-mono text-xs font-bold text-primary hover:underline"
                          >
                            {item.case_reference_id}
                          </Link>
                          <StatusChip status={item.status} />
                        </div>

                        {/* Similarity Score Pill */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <Badge
                            className={`text-xs font-semibold px-2.5 py-0.5 ${
                              isHigh
                                ? "bg-red-100 text-red-900 border-red-300 hover:bg-red-100"
                                : isModerate
                                ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-100"
                                : "bg-muted text-foreground border-border hover:bg-muted"
                            }`}
                          >
                            {isHigh ? (
                              <AlertTriangle className="h-3 w-3 mr-1 text-red-600" />
                            ) : null}
                            <span>{percent}% Match</span>
                          </Badge>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveCompareMatch(item)}
                            className="h-7 text-xs px-2.5 gap-1 hover:border-primary"
                          >
                            <GitCompare className="h-3.5 w-3.5 text-primary" />
                            <span>Compare Side-by-Side</span>
                          </Button>
                        </div>
                      </div>

                      {/* Subject & Institution */}
                      <div className="space-y-1">
                        <div className="font-semibold text-xs text-foreground">
                          {item.subject}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span>{item.institution_name}</span>
                        </div>
                      </div>

                      {/* Intersecting Keywords */}
                      {item.matched_keywords.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                            Matched Keywords:
                          </span>
                          {item.matched_keywords.map((kw) => (
                            <Badge
                              key={kw}
                              variant="outline"
                              className="text-[10px] font-mono py-0 px-1.5 bg-muted/40 text-foreground"
                            >
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Empty Prompt State */
        <Card className="border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <FileText className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">Ready for Duplicate Analysis</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Enter grievance details above or choose one of the test scenarios to evaluate similarity against existing register entries.
          </p>
        </Card>
      )}

      {/* Side-by-Side Comparison Dialog */}
      <CompareModal
        query={{
          subject,
          description,
          institution_name: institutionName,
        }}
        match={activeCompareMatch}
        open={!!activeCompareMatch}
        onOpenChange={(open) => {
          if (!open) setActiveCompareMatch(null);
        }}
      />
    </div>
  );
}
