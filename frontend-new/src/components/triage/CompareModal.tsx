import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCase } from "@/api/index";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/cases/StatusChip";
import { PriorityBadge } from "@/components/cases/PriorityBadge";
import { Link } from "@tanstack/react-router";
import {
  GitCompare,
  ExternalLink,
  Building2,
  Calendar,
  Layers,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { formatIstDate } from "@/lib/dateUtils";
import type { DuplicateMatch } from "@/types/ui";

interface CompareModalProps {
  query: {
    subject: string;
    description: string;
    institution_name?: string;
  };
  match: DuplicateMatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompareModal({
  query,
  match,
  open,
  onOpenChange,
}: CompareModalProps) {
  const caseRef = match?.case_reference_id;

  const { data: matchedCase, isLoading } = useQuery({
    queryKey: ["case", caseRef],
    queryFn: () => getCase(caseRef!),
    enabled: !!caseRef && open,
  });

  if (!match) return null;

  const similarityPercent = Math.round(match.similarity_score * 100);
  const isHighMatch = similarityPercent >= 70;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <GitCompare className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Side-by-Side Grievance Comparison
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Compare query submission against repository record{" "}
                  <span className="font-mono font-bold text-foreground">
                    {match.case_reference_id}
                  </span>
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant={isHighMatch ? "destructive" : "outline"}
              className="text-xs px-2.5 py-1 font-semibold flex items-center gap-1"
            >
              {isHighMatch ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              <span>{similarityPercent}% Similarity Overlap</span>
            </Badge>
          </div>
        </DialogHeader>

        {/* Matched Keywords Banner */}
        {match.matched_keywords.length > 0 && (
          <div className="bg-muted/50 border border-border rounded-md px-3.5 py-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">
              Intersecting Keywords:
            </span>
            {match.matched_keywords.map((kw) => (
              <Badge
                key={kw}
                variant="secondary"
                className="text-[11px] font-mono bg-primary/10 text-primary border-primary/20"
              >
                #{kw}
              </Badge>
            ))}
          </div>
        )}

        {/* Side-by-Side Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Left: Input Query Submission */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Query Submission (Draft)
              </span>
              <Badge variant="outline" className="text-[10px] bg-muted/40">
                New Intake
              </Badge>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Institution
              </span>
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{query.institution_name || "Unspecified Institution"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Subject
              </span>
              <div className="text-xs font-semibold text-foreground bg-muted/30 p-2 rounded border border-border/60">
                {query.subject || "No subject provided"}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Narrative Statement
              </span>
              <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border border-border/60 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-mono text-[11px]">
                {query.description || "No description provided"}
              </div>
            </div>
          </div>

          {/* Right: Existing Repository Match */}
          <div className="bg-card border border-primary/30 rounded-lg p-4 space-y-3 relative shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Repository Match
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  {match.case_reference_id}
                </span>
              </div>
              <StatusChip status={match.status} />
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs">Retrieving dossier details...</span>
              </div>
            ) : matchedCase ? (
              <>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Institution & Permanent ID
                  </span>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span>{matchedCase.institution_name}</span>
                  </div>
                  {matchedCase.aicte_permanent_id && (
                    <span className="text-[10px] font-mono text-muted-foreground block">
                      AICTE ID: {matchedCase.aicte_permanent_id}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Subject & Classification
                  </span>
                  <div className="text-xs font-semibold text-foreground bg-primary/5 p-2 rounded border border-primary/20">
                    {matchedCase.subject}
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Badge variant="outline" className="text-[10px]">
                      Bureau: {matchedCase.bureau_code}
                    </Badge>
                    <PriorityBadge priority={matchedCase.priority} />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Registered Description
                  </span>
                  <div className="text-xs text-foreground bg-primary/5 p-2.5 rounded border border-primary/20 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-mono text-[11px]">
                    {matchedCase.description_redacted}
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Intake: {formatIstDate(matchedCase.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    Category: {matchedCase.category}
                  </span>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Unable to load matched case details.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close Comparison
          </Button>

          <Button asChild size="sm" className="text-xs gap-1.5 shadow-2xs">
            <Link to="/cases/$id" params={{ id: match.case_reference_id }}>
              <span>Open Matched Dossier</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
