import React, { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSlaRadar, getBureaus } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type { SlaRadarItem } from "@/types/ui";
import {
  PageHeader,
  DataTable,
  type Column,
  LifecycleStrip,
  PriorityMark,
  SlaPill,
} from "@/components/shared";
import { EscalateModal } from "@/components/dossier/EscalateModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, AlertCircle, Lock } from "lucide-react";

export function SlaRadarView() {
  const navigate = useNavigate();
  const { role, user } = useRole();
  const [selectedBureau, setSelectedBureau] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [escalatingItem, setEscalatingItem] = useState<SlaRadarItem | null>(null);

  const isOfficer = role === "OFFICER";
  const canEscalate = role === "ADMIN" || role === "SUPERVISOR";
  const effectiveBureau = isOfficer
    ? (user?.bureau_id ?? "bureau-appr")
    : selectedBureau;

  // Query bureaus
  const { data: bureaus = [] } = useQuery({
    queryKey: ["bureaus"],
    queryFn: getBureaus,
    staleTime: 5 * 60 * 1000,
  });

  // Query SLA radar summary
  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["slaRadar", effectiveBureau],
    queryFn: () => getSlaRadar(effectiveBureau === "ALL" ? undefined : effectiveBureau),
    staleTime: 30 * 1000,
  });

  // Consolidate ranked cases: overdue first, then approaching
  const rankedItems = useMemo(() => {
    if (!summary) return [];
    const combined = [...(summary.overdue_cases ?? []), ...(summary.approaching_cases ?? [])];

    if (!search.trim()) return combined;
    const q = search.toLowerCase().trim();
    return combined.filter(
      (c) =>
        c.case_reference_id.toLowerCase().includes(q) ||
        (c.institution_name && c.institution_name.toLowerCase().includes(q)) ||
        c.subject.toLowerCase().includes(q),
    );
  }, [summary, search]);

  const columns: Column<SlaRadarItem>[] = [
    {
      key: "case_reference_id",
      header: "Case",
      width: "140px",
      cell: (item) => (
        <span className="font-mono text-xs text-[var(--color-text-secondary)]">
          {item.case_reference_id}
        </span>
      ),
    },
    {
      key: "institution_name",
      header: "Institution",
      cell: (item) => (
        <div>
          <div className="font-medium text-[var(--color-text-primary)] text-xs line-clamp-1">
            {item.institution_name || "Institution Name Pending"}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">
            {item.subject}
          </div>
        </div>
      ),
    },
    {
      key: "bureau",
      header: "Bureau",
      width: "90px",
      cell: (item) => (
        <span className="text-xs text-[var(--color-text-secondary)]" title={item.bureau_name || ""}>
          {item.bureau_code}
        </span>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      width: "220px",
      cell: (item) => (
        <div className="flex items-center">
          <LifecycleStrip status={item.status} currentStatus={item.status} variant="compact" />
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      width: "110px",
      cell: (item) => <PriorityMark priority={item.priority} />,
    },
    {
      key: "remaining_time",
      header: "Remaining time",
      width: "150px",
      align: "right",
      cell: (item) => (
        <SlaPill
          dueDate={item.due_date}
          hoursRemaining={item.hours_remaining}
          status={item.sla_status}
          isResolved={false}
        />
      ),
    },
    {
      key: "escalation_level",
      header: "Escalation",
      width: "100px",
      cell: (item) => (
        <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
          {item.escalation_level > 0 ? `Level ${item.escalation_level}` : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "90px",
      align: "right",
      cell: (item) => {
        if (!canEscalate) return null;
        const isMax = (item.escalation_level ?? 0) >= 2;
        return (
          <Button
            variant="outline"
            size="sm"
            disabled={isMax}
            onClick={(e) => {
              e.stopPropagation();
              setEscalatingItem(item);
            }}
            className="h-7 px-2.5 text-xs font-normal border-[var(--color-rule)] rounded-[6px] text-[var(--sla-overdue-text)] hover:text-[var(--sla-overdue-text)] bg-surface"
          >
            {isMax ? "Max level" : "Escalate"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="py-10 px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="space-y-3">
        <PageHeader
          title="SLA radar"
          description="Cases ranked by urgency across bureaus."
        />

        {/* Summary sentence under the header */}
        {summary && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--sla-overdue-text)] tabular-nums">
              {summary.overdue_count}
            </span>{" "}
            overdue,{" "}
            <span className="font-semibold text-[var(--sla-approaching-text)] tabular-nums">
              {summary.approaching_count}
            </span>{" "}
            approaching the 48-hour threshold,{" "}
            <span className="font-semibold text-[var(--sla-on-track-text)] tabular-nums">
              {summary.on_track_count}
            </span>{" "}
            on track.
          </p>
        )}
      </div>

      {/* Error notification if failed */}
      {isError && (
        <div className="flex items-center justify-between p-3.5 text-xs bg-[var(--sla-overdue-bg)] dark:bg-[#2B1015]/50 text-[var(--sla-overdue-text)] dark:text-[#F87171] border border-[var(--sla-overdue-text)]/20 dark:border-[#F87171]/35 rounded-[6px]">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Failed to load SLA radar data: {(error as Error)?.message || "Unknown error"}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="h-7 text-xs border-[var(--sla-overdue-text)]/30">
            Try again
          </Button>
        </div>
      )}

      {/* Bureau filter select above table, right-aligned with search input */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-[var(--color-rule)]">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Bureau jurisdiction:</span>
          {isOfficer ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink)] bg-surface px-2.5 py-1 border border-[var(--color-rule)] rounded-[6px]">
              <span>{user?.bureau_name || "Approval Bureau"}</span>
              <span className="font-mono text-[10px] text-[var(--color-text-muted)]">({user?.bureau_code || "APPR"})</span>
              <Lock className="h-3 w-3 text-[var(--color-text-muted)] ml-1" />
            </div>
          ) : (
            <Select
              value={selectedBureau}
              onValueChange={(val) => setSelectedBureau(val)}
            >
              <SelectTrigger className="h-8.5 w-[200px] text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
                <SelectValue placeholder="All bureaus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All bureaus</SelectItem>
                {bureaus.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Right-aligned search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
          <Input
            type="text"
            placeholder="Search radar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8.5 bg-surface border-[var(--color-rule)] rounded-[6px]"
          />
        </div>
      </div>

      {/* Main SLA Radar Table */}
      <DataTable
        columns={columns}
        data={rankedItems}
        keyField={(item) => item.case_reference_id}
        isLoading={isLoading}
        skeletonRows={8}
        onRowClick={(item) =>
          navigate({
            to: "/cases/$id",
            params: { id: item.case_reference_id },
          })
        }
        emptyMessage="No cases currently requiring urgency intervention."
        emptyInstruction="All open grievances within this bureau are operating on track."
      />

      {/* Supervisory Escalation Modal */}
      {escalatingItem && (
        <EscalateModal
          caseItem={escalatingItem}
          open={!!escalatingItem}
          onOpenChange={(open) => !open && setEscalatingItem(null)}
        />
      )}
    </div>
  );
}
