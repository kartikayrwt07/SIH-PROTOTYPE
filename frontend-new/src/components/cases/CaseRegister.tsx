import React, { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listCases, listBureaus } from "@/api/index";
import { useRole } from "@/contexts/RoleContext";
import type {
  ComplaintCase,
  CasePriority,
  CaseStatus,
  SlaStatus,
  ListCasesParams,
} from "@/types/ui";
import { ALL_STATUSES } from "@/lib/stateMachine";
import { StatusChip } from "./StatusChip";
import { SlaPill, deriveSlaStatus } from "./SlaPill";
import { PriorityBadge } from "./PriorityBadge";
import { CasePreviewDrawer } from "./CasePreviewDrawer";
import { exportCasesClientCsv } from "@/lib/csvExport";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Filter,
  Download,
  Upload,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  AlertCircle,
  Inbox,
  Building,
} from "lucide-react";

interface CaseRegisterProps {
  initialBureauId?: string;
  onSelectCase?: (c: ComplaintCase) => void;
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
  const [pageSize, setPageSize] = useState(10);

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

  // Additional client-side SLA filtering if requested
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

  return (
    <div className="space-y-4">
      {/* Officer Jurisdiction Warning Notice if scoped */}
      {role === "OFFICER" && user?.bureau_name && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-50 border border-blue-200 text-blue-900 rounded-md">
          <Building className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Officer View:</strong> Displaying cases exclusively assigned to{" "}
            <strong>{user.bureau_name} ({user.bureau_code})</strong>.
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-card p-3 rounded-lg border border-border shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search reference ID, institution name, subject..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 text-xs h-9 bg-background"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {canImport && (
              <Button asChild size="sm" variant="outline" className="text-xs h-9 gap-1.5">
                <Link to="/ingest">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Ingest CSV</span>
                </Link>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCsv}
              disabled={isLoading || displayedCases.length === 0}
              className="text-xs h-9 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60 text-xs">
          <span className="text-muted-foreground flex items-center gap-1 font-medium mr-1">
            <Filter className="h-3 w-3" /> Filters:
          </span>

          {/* Bureau Filter (Hidden/Disabled for Officer if single bureau) */}
          {role !== "OFFICER" && (
            <Select
              value={bureauFilter}
              onValueChange={(v) => {
                setBureauFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs bg-background">
                <SelectValue placeholder="All Bureaus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Bureaus</SelectItem>
                {bureaus.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.code} ({b.name.split(" ")[0]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs bg-background">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {ALL_STATUSES.map((st) => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onValueChange={(v) => {
              setPriorityFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs bg-background">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">LOW</SelectItem>
              <SelectItem value="MEDIUM">MEDIUM</SelectItem>
              <SelectItem value="HIGH">HIGH</SelectItem>
              <SelectItem value="URGENT">URGENT</SelectItem>
            </SelectContent>
          </Select>

          {/* SLA Status Filter */}
          <Select
            value={slaFilter}
            onValueChange={(v) => {
              setSlaFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs bg-background">
              <SelectValue placeholder="All SLA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All SLA Tiers</SelectItem>
              <SelectItem value="OVERDUE">Overdue Only</SelectItem>
              <SelectItem value="APPROACHING">Approaching</SelectItem>
              <SelectItem value="ON_TRACK">On Track</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Case Register Table */}
      <div className="bg-card rounded-lg border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow className="text-xs hover:bg-transparent">
                <TableHead className="w-[150px] font-semibold">Case Reference</TableHead>
                <TableHead className="min-w-[200px] font-semibold">Institution</TableHead>
                <TableHead className="w-[120px] font-semibold">Bureau</TableHead>
                <TableHead className="w-[110px] font-semibold">Priority</TableHead>
                <TableHead className="w-[150px] font-semibold">Status</TableHead>
                <TableHead className="w-[160px] font-semibold">SLA Status</TableHead>
                <TableHead className="w-[40px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="h-12">
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                // Error state
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-destructive">
                      <AlertCircle className="h-6 w-6" />
                      <p className="text-sm font-medium">Failed to load complaint records</p>
                      <p className="text-xs text-muted-foreground">
                        {(error as Error)?.message || "Network or server failure"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => refetch()}
                        className="mt-2 text-xs"
                      >
                        Try Again
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : displayedCases.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Inbox className="h-8 w-8 stroke-1" />
                      <p className="text-sm font-medium text-foreground">No complaints match your criteria</p>
                      <p className="text-xs">Try clearing search terms or selecting different filters.</p>
                      {hasActiveFilters && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs"
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Data rows
                displayedCases.map((c) => {
                  const isResolved = c.status === "Resolved" || c.status === "Closed";
                  return (
                    <TableRow
                      key={c.id}
                      onClick={() => handleRowClick(c)}
                      className="cursor-pointer hover:bg-accent/40 transition-colors h-12 text-xs group"
                    >
                      {/* Case Reference */}
                      <TableCell className="font-mono font-bold text-foreground">
                        {c.case_reference_id}
                      </TableCell>

                      {/* Institution */}
                      <TableCell>
                        <div className="font-medium text-foreground line-clamp-1">
                          {c.institution_name}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {c.aicte_permanent_id ? `ID: ${c.aicte_permanent_id}` : "—"}
                        </div>
                      </TableCell>

                      {/* Bureau */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold px-1.5 py-0 border-border bg-muted/40"
                          title={c.bureau_name}
                        >
                          {c.bureau_code}
                        </Badge>
                      </TableCell>

                      {/* Priority */}
                      <TableCell>
                        <PriorityBadge priority={c.priority} />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusChip status={c.status} />
                      </TableCell>

                      {/* SLA Status */}
                      <TableCell>
                        <SlaPill
                          dueDate={c.due_date}
                          isResolved={isResolved}
                        />
                      </TableCell>

                      {/* Chevron */}
                      <TableCell className="text-right">
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors ml-auto" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-border text-xs text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-7 w-16 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="hidden sm:inline">
              Showing{" "}
              {totalCount === 0
                ? "0"
                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)}`}{" "}
              of {totalCount} cases
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="sm:hidden text-xs">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="hidden sm:inline px-2 text-xs">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
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
