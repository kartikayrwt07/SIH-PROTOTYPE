import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSlaRadar, getBureaus } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type { SlaRadarItem } from "@/types/ui";
import { SlaSummaryTiles } from "./SlaSummaryTiles";
import { OverdueTable } from "./OverdueTable";
import { ApproachingTable } from "./ApproachingTable";
import { EscalateModal } from "@/components/dossier/EscalateModal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Timer,
  RefreshCw,
  Building2,
  Lock,
  AlertCircle,
} from "lucide-react";

export function SlaRadarView() {
  const { role, user } = useRole();
  const [selectedBureau, setSelectedBureau] = useState<string>("ALL");
  const [escalatingItem, setEscalatingItem] = useState<SlaRadarItem | null>(null);

  // Officers are strictly locked to their assigned bureau (SPEC §5)
  const isOfficer = role === "OFFICER";
  const effectiveBureau = isOfficer
    ? (user?.bureau_id ?? "bureau-appr")
    : selectedBureau;

  // Query bureaus
  const { data: bureaus = [] } = useQuery({
    queryKey: ["bureaus"],
    queryFn: getBureaus,
  });

  // Query SLA radar summary
  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["slaRadar", effectiveBureau],
    queryFn: () => getSlaRadar(effectiveBureau === "ALL" ? undefined : effectiveBureau),
  });

  return (
    <div className="container max-w-7xl mx-auto py-6 px-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            SLA Radar
          </h1>
          <p className="text-xs text-muted-foreground">
            Surveillance of upcoming deadlines, breach risks, and supervisory escalations.
          </p>
        </div>

        {/* Bureau Filter & Refresh Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-background border border-border/60 rounded-md px-2.5 py-1 text-xs">
            <span className="text-muted-foreground">Bureau:</span>

            {isOfficer ? (
              <div className="flex items-center gap-1 font-medium text-foreground pl-1">
                <span>{user?.bureau_code || "APPR"}</span>
                <span className="text-muted-foreground text-[11px]">
                  ({user?.bureau_name || "Approval Bureau"})
                </span>
                <Lock className="h-3 w-3 text-muted-foreground/60 ml-0.5" title="Locked for Officer role" />
              </div>
            ) : (
              <Select
                value={selectedBureau}
                onValueChange={(val) => setSelectedBureau(val)}
              >
                <SelectTrigger className="h-6 text-xs border-0 bg-transparent shadow-none px-1 focus:ring-0">
                  <SelectValue placeholder="All Bureaus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Bureaus</SelectItem>
                  {bureaus.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 text-xs gap-1.5 border-border/60"
            title="Refresh SLA calculations"
          >
            <RefreshCw className={`h-3.5 w-3.5 opacity-70 ${isFetching ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Failed to load SLA radar data: {(error as any)?.message || "Unknown error"}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* 1. Summary KPI Tiles (Overdue, Approaching, On Track) */}
      <SlaSummaryTiles summary={summary} isLoading={isLoading} />

      {/* 2. Section "Overdue Grievances" */}
      <OverdueTable
        items={summary?.overdue_cases ?? []}
        isLoading={isLoading}
        userRole={role}
        onEscalate={(item) => setEscalatingItem(item)}
      />

      {/* 3. Section "Approaching SLA Horizon" (< 48h) */}
      <ApproachingTable
        items={summary?.approaching_cases ?? []}
        isLoading={isLoading}
      />

      {/* Reusable Supervisory Escalation Modal */}
      {escalatingItem && (
        <EscalateModal
          caseItem={escalatingItem}
          open={!!escalatingItem}
          onOpenChange={(open) => {
            if (!open) setEscalatingItem(null);
          }}
        />
      )}
    </div>
  );
}
