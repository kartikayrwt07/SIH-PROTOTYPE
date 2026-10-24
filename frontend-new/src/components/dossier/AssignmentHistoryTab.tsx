import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getAssignmentHistory } from "@/api/index";
import type { AssignmentHistoryEntry } from "@/types/ui";
import { formatIST } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AssignmentHistoryTabProps {
  caseRef: string;
}

export function AssignmentHistoryTab({ caseRef }: AssignmentHistoryTabProps) {
  const { data: history = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["history", caseRef],
    queryFn: () => getAssignmentHistory(caseRef),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 py-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-[4px]" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-6 text-xs text-[var(--sla-overdue-text)] space-y-2">
        <p>Failed to retrieve assignment history: {(error as Error)?.message || "Unknown error"}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-7 border-[var(--color-rule)]">
          Try again
        </Button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-8 text-xs text-[var(--color-text-secondary)] space-y-1">
        <p className="font-medium text-[var(--color-text-primary)]">No jurisdiction transfers recorded</p>
        <p>Case remains assigned to its initial intake bureau allocation.</p>
      </div>
    );
  }

  return (
    <div className="py-2 overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-rule)] text-[var(--color-text-muted)]">
            <th className="py-2.5 pr-4 font-medium">From</th>
            <th className="py-2.5 px-4 font-medium">To</th>
            <th className="py-2.5 px-4 font-medium">Transfer justification</th>
            <th className="py-2.5 px-4 font-medium">Assigned by</th>
            <th className="py-2.5 pl-4 text-right font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-rule)]">
          {history.map((entry) => (
            <tr key={entry.id} className="text-[var(--color-text-primary)] hover:bg-[var(--color-page)] transition-none">
              <td className="py-3 pr-4 text-[var(--color-text-secondary)]">
                {entry.from_bureau_name || "Initial Intake"}
              </td>
              <td className="py-3 px-4 font-medium">
                {entry.to_bureau_name || entry.to_bureau_id}
              </td>
              <td className="py-3 px-4 text-[var(--color-text-secondary)] max-w-xs leading-relaxed">
                {entry.transfer_reason}
              </td>
              <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                {entry.assigned_by_name || "—"}
              </td>
              <td className="py-3 pl-4 text-right font-mono text-[11px] text-[var(--color-text-muted)] tabular-nums whitespace-nowrap">
                {formatIST(entry.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
