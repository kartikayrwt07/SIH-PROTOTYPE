import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCases } from "@/api/index";
import type { CaseStatus } from "@/types/ui";
import { ALL_STATUSES } from "@/lib/stateMachine";
import { StateGraph } from "./StateGraph";
import { StateDetailsPanel } from "./StateDetailsPanel";
import { IllegalMoveSimulator } from "./IllegalMoveSimulator";
import { GitBranch, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function StateMachineView() {
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus>("In Progress");

  // Query cases to calculate live distribution across the 9 states
  const { data: casesData } = useQuery({
    queryKey: ["cases", { page: 1, limit: 100 }],
    queryFn: () => listCases({ page: 1, limit: 100 }),
  });

  const cases = casesData?.items ?? [];

  const caseCountsByStatus = cases.reduce<Record<CaseStatus, number>>(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<CaseStatus, number>,
  );

  return (
    <div className="container max-w-7xl mx-auto py-6 px-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          State Machine
        </h1>
        <p className="text-xs text-muted-foreground">
          Visual topology of statutory grievance lifecycle states and transition guards.
        </p>
      </div>

      {/* Main 2-Column Layout: Visual Graph (2 cols) & State Inspector (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Visual Graph Canvas */}
        <div className="lg:col-span-2 space-y-6">
          <StateGraph
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            caseCountsByStatus={caseCountsByStatus}
          />
        </div>

        {/* State Details & Guard Rules Side Panel */}
        <div className="lg:col-span-1 lg:sticky lg:top-4">
          <StateDetailsPanel
            status={selectedStatus}
            onSelectStatus={setSelectedStatus}
            caseCount={caseCountsByStatus[selectedStatus] ?? 0}
          />
        </div>
      </div>

      {/* Interactive "Try an Illegal Move" Simulator Section */}
      <IllegalMoveSimulator />
    </div>
  );
}
