import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotes, addNote } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type { Note } from "@/types/ui";
import { formatIST } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Lock } from "lucide-react";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", caseRef] });
      queryClient.invalidateQueries({ queryKey: ["timeline", caseRef] });
      toast.success("Note added");
      setContent("");
      setIsConfidential(false);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err?.message || "Failed to record case note.");
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

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-6 text-xs text-[var(--sla-overdue-text)] space-y-2">
        <p>Failed to retrieve notes: {(error as Error)?.message || "Unknown error"}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-7 border-[var(--color-rule)]">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="py-3 space-y-6">
      {/* 1. List of notes with author and timestamp */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="py-4 text-xs text-[var(--color-text-secondary)] space-y-1">
            <p className="font-medium text-[var(--color-text-primary)]">No notes recorded yet</p>
            <p>Internal case notes added by officers will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-rule)]">
            {notes.map((note) => (
              <div key={note.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {note.author_name || note.author_role || "Officer"}
                    </span>
                    {note.is_confidential && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] font-normal">
                        <Lock className="h-3 w-3" /> Confidential
                      </span>
                    )}
                  </div>
                  <time className="font-mono text-[11px] text-[var(--color-text-muted)] tabular-nums">
                    {formatIST(note.created_at)}
                  </time>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Add-note form below the list (role gated, unchanged) */}
      {!isAuditor ? (
        <form onSubmit={handleAddNote} className="pt-4 border-t border-[var(--color-rule)] space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="note-content" className="text-xs font-medium text-[var(--color-text-primary)] block">
              Add note
            </Label>
            <Textarea
              id="note-content"
              placeholder="Record inquiry findings, hearing notes, or case updates..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (formError) setFormError(null);
              }}
              rows={3}
              className="text-xs bg-surface border-[var(--color-rule)] rounded-[6px] focus-visible:ring-1 focus-visible:ring-[var(--color-action)]"
            />
            {formError && (
              <p className="text-xs text-[var(--sla-overdue-text)]">{formError}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="confidential"
                checked={isConfidential}
                onCheckedChange={(checked) => setIsConfidential(!!checked)}
              />
              <Label
                htmlFor="confidential"
                className="text-xs text-[var(--color-text-secondary)] font-normal cursor-pointer select-none"
              >
                Mark as confidential (hidden from Auditor)
              </Label>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending || !content.trim()}
              className="h-8 px-4 text-xs font-medium bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 rounded-[6px]"
            >
              {mutation.isPending ? "Saving..." : "Save note"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="pt-4 border-t border-[var(--color-rule)] text-xs text-[var(--color-text-muted)]">
          Note addition is disabled for the Auditor role.
        </div>
      )}
    </div>
  );
}
