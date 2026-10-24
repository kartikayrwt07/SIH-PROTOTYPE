import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotes, addNote } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type { Note } from "@/types/ui";
import { formatIST } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  FileText,
  Lock,
  Send,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";

interface InternalNotesTabProps {
  caseRef: string;
}

export function InternalNotesTab({ caseRef }: InternalNotesTabProps) {
  const queryClient = useQueryClient();
  const { role } = useRole();
  const isAuditor = role === "AUDITOR";

  const [content, setContent] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: notes = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["notes", caseRef, role],
    queryFn: () => getNotes(caseRef),
    staleTime: 30 * 1000,
  });

  const mutation = useMutation({
    mutationFn: addNote,
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["notes", caseRef] });
      queryClient.invalidateQueries({ queryKey: ["timeline", caseRef] });
      toast.success(
        newNote.is_confidential
          ? "Confidential internal note added"
          : "Internal note added to case",
      );
      setContent("");
      setIsConfidential(false);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err?.message || "Failed to record internal note.");
    },
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 2) {
      setFormError("Note content must be at least 2 characters.");
      return;
    }
    setFormError(null);
    mutation.mutate({
      case_ref: caseRef,
      content: content.trim(),
      is_confidential: isConfidential,
    });
  };

  return (
    <div className="p-4 space-y-5">
      {/* Add Note Form (Hidden for Auditor) */}
      {isAuditor ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Auditor Mode:</strong> Read-only audit access. Internal note composition is disabled and confidential statements are redacted.
          </span>
        </div>
      ) : (
        <form onSubmit={handleAddNote} className="bg-muted/30 border border-border rounded-lg p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="note-content" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Record Case Note</span>
            </Label>
            <span className="text-[10px] text-muted-foreground">Internal officer tracking</span>
          </div>

          <Textarea
            id="note-content"
            placeholder="Document investigation findings, telephone inquiries, or procedural notes..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (formError) setFormError(null);
            }}
            rows={2}
            className="text-xs bg-background"
            disabled={mutation.isPending}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="confidential-check"
                checked={isConfidential}
                onCheckedChange={(c) => setIsConfidential(!!c)}
                disabled={mutation.isPending}
              />
              <Label htmlFor="confidential-check" className="text-xs text-muted-foreground font-normal cursor-pointer flex items-center gap-1">
                <Lock className="h-3 w-3 text-amber-600" />
                <span>Mark as confidential (Redacted for Auditors)</span>
              </Label>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending || !content.trim()}
              className="text-xs h-8 gap-1.5 font-medium"
            >
              {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              <span>Post Note</span>
            </Button>
          </div>

          {formError && (
            <div className="text-xs text-destructive flex items-center gap-1 pt-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{formError}</span>
            </div>
          )}
        </form>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        <div className="text-[11px] text-muted-foreground font-medium border-b border-border pb-1">
          Recorded Case Notes ({notes.length})
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-4 text-center text-xs text-destructive space-y-2">
            <p>Failed to load notes: {(error as Error)?.message || "Unknown error"}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-7">
              Retry
            </Button>
          </div>
        ) : notes.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
            <FileText className="h-7 w-7 mx-auto text-muted-foreground/60 mb-2 stroke-1" />
            <p className="font-medium text-foreground">No internal notes posted yet</p>
            <p>Authorized officers can append procedural observations and investigation records.</p>
          </div>
        ) : (
          notes.map((note) => {
            const isConfidentialMasked = isAuditor && note.is_confidential;

            return (
              <div
                key={note.id}
                className={`p-3 rounded-lg border text-xs space-y-2 ${
                  note.is_confidential
                    ? "bg-amber-50/40 border-amber-200"
                    : "bg-card border-border/60 shadow-none"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">
                      {note.author_name ?? "Officer"}
                    </span>
                    {note.author_role && (
                      <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 h-4 border-border">
                        {note.author_role}
                      </Badge>
                    )}
                    {note.is_confidential && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-amber-100 text-amber-800 border-amber-300 font-semibold gap-1 px-1.5 py-0 h-4"
                      >
                        <Lock className="h-2.5 w-2.5" />
                        Confidential
                      </Badge>
                    )}
                  </div>

                  <time className="text-[10px] text-muted-foreground tabular-nums">
                    {formatIST(note.created_at)}
                  </time>
                </div>

                <div
                  className={`leading-relaxed ${
                    isConfidentialMasked
                      ? "italic text-amber-800 flex items-center gap-1.5 font-medium"
                      : "text-foreground"
                  }`}
                >
                  {isConfidentialMasked ? (
                    <>
                      <Lock className="h-3.5 w-3.5 text-amber-700 flex-shrink-0" />
                      <span>[Confidential — not visible to Auditor]</span>
                    </>
                  ) : (
                    note.content
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
