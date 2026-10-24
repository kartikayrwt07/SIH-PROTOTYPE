import React, { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listCases, listBureaus } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type {
  ComplaintCase,
  CasePriority,
  CaseStatus,
  ListCasesParams,
} from "@/types/ui";
import { ALL_STATUSES } from "@/lib/stateMachine";
import {
  PageHeader,
  DataTable,
  type Column,
  LifecycleStrip,
  PriorityMark,
  SlaPill,
} from "@/components/shared";
import { deriveSlaStatus } from "@/components/cases/SlaPill";
import { CasePreviewDrawer } from "./CasePreviewDrawer";
import { exportCasesClientCsv } from "@/lib/csvExport";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface CaseRegisterProps {
  initialBureauId?: string | undefined;
  onSelectCase?: ((c: ComplaintCase) => void) | undefined;
}

export function CaseRegister({ initialBureauId }: CaseRegisterProps) {
  const { role, user } = useRole();
  const canImport = user?.permissions.includes("cases:import") || role === "ADMIN";

  // Filter and search state
  const [search, setSearch] = useState("");
  const [bureauFilter, setBureauFilter] = useState<string>(initialBureauId ?? "ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [slaFilter, setSlaFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Preview drawer state
  const [previewCase, setPreviewCase] = useState<ComplaintCase | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch bureaus for dynamic filter
  const { data: bureaus = [] } = useQuery({
    queryKey: ["bureaus"],
    queryFn: listBureaus,
    staleTime: 5 * 60 * 1000,
  });

  // Query params
  const queryParams: ListCasesParams = useMemo(() => {
    const params: ListCasesParams = {
      page,
      page_size: pageSize,
      search: search.trim() || undefined,
    };
    if (bureauFilter !== "ALL") params.bureau_id = bureauFilter;
    if (statusFilter !== "ALL") params.status = statusFilter as CaseStatus;
    if (priorityFilter !== "ALL") params.priority = priorityFilter as CasePriority;
    return params;
  }, [page, pageSize, search, bureauFilter, statusFilter, priorityFilter]);

  // Query cases from API
  const {
    data: casesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cases", queryParams, role, user?.bureau_id],
    queryFn: () => listCases(queryParams),
    staleTime: 30 * 1000,
  });

  // Additional client-side SLA filtering
  const displayedCases = useMemo(() => {
    if (!casesResponse?.items) return [];
    if (slaFilter === "ALL") return casesResponse.items;

    return casesResponse.items.filter((c) => {
      const isResolved = c.status === "Resolved" || c.status === "Closed";
      const sla = deriveSlaStatus(c.due_date, isResolved);
      return sla.status === slaFilter;
    });
  }, [casesResponse?.items, slaFilter]);

  const hasActiveFilters =
    search.trim() !== "" ||
    bureauFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    slaFilter !== "ALL";

  const handleResetFilters = () => {
    setSearch("");
    setBureauFilter("ALL");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setSlaFilter("ALL");
    setPage(1);
  };

  const handleRowClick = (caseItem: ComplaintCase) => {
    setPreviewCase(caseItem);
    setDrawerOpen(true);
  };

  const handleExportCsv = () => {
    if (displayedCases.length > 0) {
      exportCasesClientCsv(displayedCases, role);
    }
  };

  const totalPages = casesResponse?.total_pages ?? 1;
  const totalCount = casesResponse?.total ?? 0;
  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  // Table columns definition
  const columns: Column<ComplaintCase>[] = [
    {
      key: "case_reference_id",
      header: "Case",
      width: "140px",
      cell: (c) => (
        <span className="font-mono text-xs text-[var(--color-text-secondary)]">
          {c.case_reference_id}
        </span>
      ),
    },
    {
      key: "institution_name",
      header: "Institution",
      cell: (c) => (
        <div>
          <div className="font-medium text-[var(--color-text-primary)] text-xs line-clamp-1">
            {c.institution_name}
          </div>
          <div className="font-mono text-[10px] text-[var(--color-text-muted)]">
            {c.aicte_permanent_id ? c.aicte_permanent_id : "—"}
          </div>
        </div>
      ),
    },
    {
      key: "bureau",
      header: "Bureau",
      width: "100px",
      cell: (c) => (
        <span className="text-xs text-[var(--color-text-secondary)]" title={c.bureau_name}>
          {c.bureau_code}
        </span>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      width: "220px",
      cell: (c) => (
        <div className="flex items-center">
          <LifecycleStrip status={c.status} variant="compact" />
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      width: "110px",
      cell: (c) => <PriorityMark priority={c.priority} />,
    },
    {
      key: "due",
      header: "Due",
      width: "150px",
      align: "right",
      cell: (c) => {
        const isResolved = c.status === "Resolved" || c.status === "Closed";
        return <SlaPill dueDate={c.due_date} isResolved={isResolved} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Case register"
        description="Search, filter and open any case you are allowed to see."
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isLoading || displayedCases.length === 0}
              className="h-8 px-3 text-xs font-medium border-[var(--color-rule)] bg-surface text-[var(--color-text-primary)] rounded-[6px]"
            >
              Export CSV
            </Button>
            {canImport && (
              <Button
                asChild
                size="sm"
                className="h-8 px-3 text-xs font-medium bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90 rounded-[6px]"
              >
                <Link to="/ingest">Ingest CSV</Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Quiet Toolbar Row */}
      <div className="flex flex-wrap items-center gap-3 py-3.5 border-y border-[var(--color-rule)]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
          <Input
            type="text"
            placeholder="Search reference ID, institution, subject..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 text-xs h-8 bg-surface border-[var(--color-rule)] rounded-[6px]"
          />
        </div>

        {/* Bureau Select */}
        {role !== "OFFICER" && (
          <Select
            value={bureauFilter}
            onValueChange={(v) => {
              setBureauFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
              <SelectValue placeholder="All bureaus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All bureaus</SelectItem>
              {bureaus.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.code} ({b.name.split(" ")[0]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Status Select */}
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ALL_STATUSES.map((st) => (
              <SelectItem key={st} value={st}>
                {st}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Select */}
        <Select
          value={priorityFilter}
          onValueChange={(v) => {
            setPriorityFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>

        {/* SLA Status Select */}
        <Select
          value={slaFilter}
          onValueChange={(v) => {
            setSlaFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
            <SelectValue placeholder="All SLA" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All SLA</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="APPROACHING">Approaching</SelectItem>
            <SelectItem value="ON_TRACK">On track</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters text button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 px-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-transparent"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Case Register Data Table */}
      <DataTable
        columns={columns}
        data={displayedCases}
        keyField={(c) => c.id}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        skeletonRows={pageSize > 10 ? 10 : pageSize}
        emptyMessage="No complaint cases match your criteria."
        emptyInstruction="Try clearing filters or adjusting your search parameters."
        emptyAction={
          hasActiveFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs border-[var(--color-rule)]"
            >
              Clear filters
            </Button>
          ) : undefined
        }
      />

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2 text-xs text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-3">
          <span className="text-[var(--color-text-muted)]">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-7 w-16 text-xs bg-surface border-[var(--color-rule)] rounded-[6px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>

          <span className="tabular-nums">
            Showing {startIndex} to {endIndex} of {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs border-[var(--color-rule)] bg-surface rounded-[6px]"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Previous
          </Button>
          <span className="tabular-nums px-1 text-[var(--color-text-muted)]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs border-[var(--color-rule)] bg-surface rounded-[6px]"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Quick Preview Drawer */}
      <CasePreviewDrawer
        caseItem={previewCase}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
