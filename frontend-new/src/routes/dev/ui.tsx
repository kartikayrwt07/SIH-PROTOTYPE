import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  LifecycleStrip,
  StatusMark,
  SlaPill,
  PriorityMark,
  PageHeader,
  DataTable,
  type Column,
  RedactionBar,
  EmptyState,
  ErrorState,
} from "@/components/shared";
import { ALL_STATUSES } from "@/lib/stateMachine";
import type { CasePriority } from "@/types/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dev/ui")({
  component: DevUiPage,
});

interface SampleRow {
  id: string;
  name: string;
  bureau: string;
  openCases: number;
  resolvedCases: number;
}

const SAMPLE_DATA: SampleRow[] = [
  { id: "APPR", name: "Approval Bureau", bureau: "APPR", openCases: 14, resolvedCases: 8 },
  { id: "STU",  name: "Student Welfare Bureau", bureau: "STU",  openCases: 12, resolvedCases: 4 },
  { id: "FDC",  name: "Faculty Development Bureau", bureau: "FDC",  openCases: 10, resolvedCases: 2 },
  { id: "FIN",  name: "Finance Bureau", bureau: "FIN",  openCases: 8,  resolvedCases: 0 },
];

function DevUiPage() {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const columns: Column<SampleRow>[] = [
    { key: "id", header: "Code", width: "100px", cell: (r) => <span className="font-mono">{r.id}</span> },
    { key: "name", header: "Bureau name", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: "openCases", header: "Open cases", align: "right", cell: (r) => r.openCases },
    { key: "resolvedCases", header: "Resolved cases", align: "right", cell: (r) => r.resolvedCases },
  ];

  return (
    <div className="container max-w-5xl mx-auto py-8 px-6 space-y-10 bg-page">
      <PageHeader
        title="Shared UI components"
        description="Design system foundation for the AICTE Case Monitor register. Dense, ruled, legible, calm."
        action={
          <Button size="sm" className="bg-action text-white hover:bg-action/90 h-8 text-xs font-medium rounded-md">
            Export documentation
          </Button>
        }
      />

      {/* 1. LifecycleStrip */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary border-b border-rule pb-2">
          1. LifecycleStrip
        </h2>

        <div className="space-y-6 bg-surface border border-rule p-5 rounded">
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-text-muted">Compact variant (for table rows, all 9 stages):</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_STATUSES.map((st) => (
                <div key={st} className="p-2 border border-rule rounded bg-page flex items-center">
                  <LifecycleStrip status={st} variant="compact" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-rule">
            <h3 className="text-xs font-medium text-text-muted">Full variant (dossier header):</h3>

            <div className="space-y-4">
              <div className="p-4 border border-rule rounded bg-page space-y-1">
                <span className="text-[11px] text-text-muted block">In Progress (Within SLA window):</span>
                <LifecycleStrip
                  status="In Progress"
                  variant="full"
                  createdAt={new Date(Date.now() - 36 * 3600 * 1000).toISOString()}
                  dueDate={new Date(Date.now() + 48 * 3600 * 1000).toISOString()}
                />
              </div>

              <div className="p-4 border border-rule rounded bg-page space-y-1">
                <span className="text-[11px] text-text-muted block">Under Review (Overdue SLA target):</span>
                <LifecycleStrip
                  status="Under Review"
                  variant="full"
                  createdAt={new Date(Date.now() - 96 * 3600 * 1000).toISOString()}
                  dueDate={new Date(Date.now() - 12 * 3600 * 1000).toISOString()}
                />
              </div>

              <div className="p-4 border border-rule rounded bg-page space-y-1">
                <span className="text-[11px] text-text-muted block">Resolved (Complete, SLA marker hidden):</span>
                <LifecycleStrip
                  status="Resolved"
                  variant="full"
                  dueDate={new Date(Date.now() + 24 * 3600 * 1000).toISOString()}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. StatusMark */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary border-b border-rule pb-2">
          2. StatusMark (Small square + label, no filled pills)
        </h2>
        <div className="bg-surface border border-rule p-5 rounded">
          <div className="flex flex-wrap gap-4">
            {ALL_STATUSES.map((st) => (
              <div key={st} className="px-2.5 py-1.5 border border-rule rounded bg-page">
                <StatusMark status={st} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SlaPill */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary border-b border-rule pb-2">
          3. SlaPill (Information colours, plain text, tabular numerals)
        </h2>
        <div className="bg-surface border border-rule p-5 rounded flex flex-wrap items-center gap-3">
          <SlaPill status="OVERDUE" hoursRemaining={-6} />
          <SlaPill status="APPROACHING" hoursRemaining={31} />
          <SlaPill status="ON_TRACK" hoursRemaining={96} />
          <SlaPill isResolved />
          <SlaPill hoursRemaining={null} />
        </div>
      </section>

      {/* 4. PriorityMark */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary border-b border-rule pb-2">
          4. PriorityMark (1–4 bars, URGENT in red)
        </h2>
        <div className="bg-surface border border-rule p-5 rounded flex items-center gap-6">
          {(["LOW", "MEDIUM", "HIGH", "URGENT"] as CasePriority[]).map((pr) => (
            <PriorityMark key={pr} priority={pr} />
          ))}
        </div>
      </section>

      {/* 5. DataTable */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary border-b border-rule pb-2">
          5. DataTable (Sticky header, 1px rules, keyboard focus, right-aligned numbers)
        </h2>
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs text-text-muted">Standard data table:</span>
            <DataTable
              columns={columns}
              data={SAMPLE_DATA}
              keyField={(r) => r.id}
              onRowClick={(r) => setSelectedRow(r.name)}
            />
            {selectedRow && (
              <p className="text-xs text-action mt-1">Focused / selected: {selectedRow}</p>
            )}
          </div>

          <div className="space-y-1 pt-2">
            <span className="text-xs text-text-muted">Loading skeleton state:</span>
            <DataTable
              columns={columns}
              data={[]}
              keyField={(r) => r.id}
              isLoading
              skeletonRows={3}
            />
          </div>

          <div className="space-y-1 pt-2">
            <span className="text-xs text-text-muted">Empty state:</span>
            <DataTable
              columns={columns}
              data={[]}
              keyField={(r) => r.id}
              emptyMessage="No grievances matching criteria."
              emptyInstruction="Try resetting your filters."
            />
          </div>
        </div>
      </section>

      {/* 6. RedactionBar */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary border-b border-rule pb-2">
          6. RedactionBar (Solid ink bars, lock icon, governance note)
        </h2>
        <div className="bg-surface border border-rule p-5 rounded max-w-xl">
          <RedactionBar lines={3} />
        </div>
      </section>

      {/* 7. EmptyState & ErrorState */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary border-b border-rule pb-2">
          7. EmptyState & ErrorState (Plain language, one sentence what happened, one what to do)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface border border-rule rounded p-4">
            <EmptyState
              message="No cases assigned to this bureau."
              instruction="New grievances routed to this jurisdiction will appear here."
              actionText="Open register"
              onAction={() => alert("Open register")}
            />
          </div>

          <div className="bg-surface border border-rule rounded p-4">
            <ErrorState
              error="The case file could not be retrieved from the server."
              onRetry={() => alert("Retrying...")}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
