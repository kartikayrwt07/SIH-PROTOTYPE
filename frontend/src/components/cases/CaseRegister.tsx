import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Building2,
  AlertCircle,
  Clock,
  Layers,
  Download,
  FileUp,
  Loader2,
  CheckCircle2,
  Wand2,
} from "lucide-react";
import { ComplaintCase, Bureau, CaseStatus, CasePriority } from "../../types";
import { api } from "../../services/api";
import { SlaBadge } from "../common/SlaBadge";
import { CsvIngestionModal } from "../ingest/CsvIngestionModal";

interface CaseRegisterProps {
  onSelectCase: (caseRef: string) => void;
  initialBureauFilter?: string;
  initialSearch?: string;
  onOpenMagicIntake?: () => void;
}

export const CaseRegister: React.FC<CaseRegisterProps> = ({
  onSelectCase,
  initialBureauFilter,
  initialSearch,
  onOpenMagicIntake,
}) => {
  const [cases, setCases] = useState<ComplaintCase[]>([]);
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Ingestion & Export states (Phase 7)
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState<string>(initialSearch || "");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [bureauFilter, setBureauFilter] = useState<string>(initialBureauFilter || "");

  useEffect(() => {
    if (initialBureauFilter !== undefined) {
      setBureauFilter(initialBureauFilter);
    }
  }, [initialBureauFilter]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);
  const [sortBy, setSortBy] = useState<"created_at" | "due_date" | "priority" | "status" | "subject">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Load bureaus once
  useEffect(() => {
    let isMounted = true;
    api.getBureaus().then((res) => {
      if (isMounted && res.success && res.data) {
        setBureaus(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch cases
  const loadCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getCases({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        bureau_id: bureauFilter || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      });

      if (res.success && res.data) {
        setCases(res.data);
        if (res.metadata) {
          setTotalRecords(res.metadata.total_records);
          setTotalPages(res.metadata.total_pages);
        }
      } else {
        setError(res.error?.message || "Failed to load complaint cases.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to service");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter, priorityFilter, bureauFilter, sortBy, sortDir]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    priorityFilter && setPriorityFilter("");
    setBureauFilter("");
    setSortBy("created_at");
    setSortDir("desc");
    setPage(1);
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(null);
    try {
      const { blob, filename } = await api.exportCasesCsv({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        bureau_id: bureauFilter || undefined,
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportSuccess(`Successfully downloaded ${filename}`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const getPriorityBadge = (priority: CasePriority) => {
    switch (priority) {
      case "URGENT":
        return {
          bg: "rgba(239, 68, 68, 0.15)",
          color: "var(--risk-overdue)",
          border: "rgba(239, 68, 68, 0.35)",
        };
      case "HIGH":
        return {
          bg: "rgba(245, 158, 11, 0.15)",
          color: "var(--risk-approaching)",
          border: "rgba(245, 158, 11, 0.35)",
        };
      case "MEDIUM":
        return {
          bg: "rgba(59, 130, 246, 0.15)",
          color: "var(--status-assigned)",
          border: "rgba(59, 130, 246, 0.3)",
        };
      case "LOW":
        return {
          bg: "rgba(148, 163, 184, 0.1)",
          color: "var(--text-muted)",
          border: "var(--border-subtle)",
        };
    }
  };

  const getStatusBadgeColor = (status: CaseStatus) => {
    switch (status) {
      case "Received":
        return { bg: "rgba(148, 163, 184, 0.15)", color: "#cbd5e1" };
      case "Registered":
        return { bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" };
      case "Under Triage":
        return { bg: "rgba(168, 85, 247, 0.15)", color: "#c084fc" };
      case "Assigned":
        return { bg: "rgba(6, 182, 212, 0.15)", color: "#22d3ee" };
      case "In Progress":
        return { bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" };
      case "Awaiting Information":
        return { bg: "rgba(249, 115, 22, 0.15)", color: "#fb923c" };
      case "Under Review":
        return { bg: "rgba(236, 72, 153, 0.15)", color: "#f472b6" };
      case "Resolved":
        return { bg: "rgba(16, 185, 129, 0.15)", color: "#34d399" };
      case "Closed":
        return { bg: "rgba(100, 116, 139, 0.2)", color: "#94a3b8" };
      default:
        return { bg: "rgba(100, 116, 139, 0.2)", color: "#94a3b8" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Control Bar */}
      <div
        className="card-base"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem",
        }}
      >
        {/* Left: Search input */}
        <div style={{ position: "relative", minWidth: "280px", flex: "1 1 300px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: "2.3rem", width: "100%" }}
            placeholder="Search reference, subject, category, institution..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Right: Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          {/* Status Filter */}
          <select
            className="select-field"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by case status"
          >
            <option value="">All Statuses</option>
            <option value="Received">Received</option>
            <option value="Registered">Registered</option>
            <option value="Under Triage">Under Triage</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Awaiting Information">Awaiting Information</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            className="select-field"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by priority"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Bureau Filter */}
          <select
            className="select-field"
            value={bureauFilter}
            onChange={(e) => {
              setBureauFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by bureau"
          >
            <option value="">All Bureaus</option>
            {bureaus.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} - {b.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            className="select-field"
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split("-") as [
                "created_at" | "due_date" | "priority" | "status" | "subject",
                "asc" | "desc"
              ];
              setSortBy(sb);
              setSortDir(sd);
            }}
            aria-label="Sort cases"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="due_date-asc">SLA Due Soonest</option>
            <option value="due_date-desc">SLA Due Furthest</option>
            <option value="priority-desc">Priority (High to Low)</option>
          </select>

          {/* Reset Filters */}
          <button
            className="btn btn-secondary"
            onClick={handleResetFilters}
            title="Reset all filters"
            style={{ padding: "0.5rem 0.75rem" }}
          >
            <RotateCcw size={16} />
          </button>

          {/* Magic AI Intake */}
          {onOpenMagicIntake && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenMagicIntake}
              title="Launch Zero-Shot Magic AI Grievance Intake"
              style={{
                padding: "0.5rem 0.95rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                background: "linear-gradient(135deg, var(--accent-saffron) 0%, #EA580C 100%)",
                color: "#FFFFFF",
                fontWeight: 700,
                boxShadow: "0 2px 10px rgba(249, 115, 22, 0.35)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Wand2 size={16} />
              <span>Magic AI Intake</span>
            </button>
          )}

          {/* Import CSV Batch (Phase 7) */}
          <button
            className="btn btn-secondary"
            onClick={() => setIsImportModalOpen(true)}
            title="Import batch cases from CSV file"
            style={{
              padding: "0.5rem 0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              borderColor: "rgba(59, 130, 246, 0.35)",
            }}
          >
            <FileUp size={16} color="var(--accent-aicte-blue)" />
            <span>Import CSV</span>
          </button>

          {/* Export Filtered CSV (Phase 7) */}
          <button
            className="btn btn-secondary"
            onClick={handleExportCsv}
            disabled={isExporting}
            title="Export currently filtered complaint cases to CSV"
            style={{
              padding: "0.5rem 0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
            }}
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} color="var(--accent-saffron)" />
            )}
            <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "rgba(239, 68, 68, 0.15)",
            color: "var(--risk-overdue)",
            borderRadius: "6px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.85rem",
          }}
        >
          <AlertCircle size={16} />
          <span>{exportError}</span>
        </div>
      )}

      {exportSuccess && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "rgba(16, 185, 129, 0.15)",
            color: "#10b981",
            borderRadius: "6px",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.85rem",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="card-base" style={{ padding: "0", overflow: "hidden" }}>
        {error && (
          <div
            style={{
              padding: "1rem",
              background: "rgba(239, 68, 68, 0.15)",
              color: "var(--risk-overdue)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "rgba(30, 41, 59, 0.7)",
                  borderBottom: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <th style={{ padding: "0.85rem 1rem" }}>Reference</th>
                <th style={{ padding: "0.85rem 1rem" }}>Institution</th>
                <th style={{ padding: "0.85rem 1rem" }}>Subject & Category</th>
                <th style={{ padding: "0.85rem 1rem" }}>Bureau</th>
                <th style={{ padding: "0.85rem 1rem" }}>Priority</th>
                <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                <th style={{ padding: "0.85rem 1rem" }}>SLA Target</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                      <Clock size={18} className="animate-spin" />
                      Loading case register...
                    </div>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <Layers size={36} style={{ margin: "0 auto 0.75rem auto", opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-secondary)" }}>
                      No complaint cases match your search criteria.
                    </div>
                    <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      Try adjusting or clearing your filters.
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={handleResetFilters}
                      style={{ marginTop: "1rem" }}
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const pBadge = getPriorityBadge(c.priority);
                  const sBadge = getStatusBadgeColor(c.status);

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Case Reference */}
                      <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => onSelectCase(c.case_reference_id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--accent-saffron)",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            textDecoration: "underline",
                            padding: 0,
                          }}
                        >
                          {c.case_reference_id}
                        </button>
                      </td>

                      {/* Institution */}
                      <td style={{ padding: "0.85rem 1rem", maxWidth: "220px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={c.institution?.name}
                        >
                          {c.institution?.name || "AICTE Approved Institution"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            marginTop: "2px",
                          }}
                        >
                          <Building2 size={12} />
                          {c.institution?.state ? `${c.institution.district}, ${c.institution.state}` : "Region Unassigned"}
                        </div>
                      </td>

                      {/* Subject & Category */}
                      <td style={{ padding: "0.85rem 1rem", maxWidth: "280px" }}>
                        <div
                          style={{
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: 500,
                          }}
                          title={c.subject}
                        >
                          {c.subject}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {c.category}
                        </div>
                      </td>

                      {/* Bureau */}
                      <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            background: "rgba(59, 130, 246, 0.12)",
                            color: "var(--accent-aicte-blue)",
                            border: "1px solid rgba(59, 130, 246, 0.25)",
                          }}
                        >
                          {c.bureau?.code || "CELL"}
                        </span>
                      </td>

                      {/* Priority */}
                      <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            background: pBadge.bg,
                            color: pBadge.color,
                            border: `1px solid ${pBadge.border}`,
                          }}
                        >
                          {c.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.25rem 0.55rem",
                            borderRadius: "9999px",
                            background: sBadge.bg,
                            color: sBadge.color,
                          }}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* SLA Target */}
                      <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                        <SlaBadge dueDate={c.due_date} status={c.status} escalationLevel={c.escalation_level} />
                      </td>

                      {/* Action */}
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                          onClick={() => onSelectCase(c.case_reference_id)}
                        >
                          Inspect <ExternalLink size={13} style={{ marginLeft: "4px" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1.25rem",
            background: "rgba(15, 23, 42, 0.6)",
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "0.85rem",
            gap: "0.75rem",
          }}
        >
          <div style={{ color: "var(--text-muted)" }}>
            Showing{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {totalRecords === 0 ? 0 : (page - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {Math.min(page * pageSize, totalRecords)}
            </strong>{" "}
            of <strong style={{ color: "var(--text-primary)" }}>{totalRecords}</strong> cases
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Rows per page:</span>
              <select
                className="select-field"
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button
                className="btn btn-secondary"
                style={{ padding: "0.3rem 0.5rem" }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span
                style={{
                  padding: "0.3rem 0.75rem",
                  background: "var(--bg-input)",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: "0.3rem 0.5rem" }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Ingestion Modal (Phase 7) */}
      <CsvIngestionModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          loadCases();
        }}
      />
    </div>
  );
};
