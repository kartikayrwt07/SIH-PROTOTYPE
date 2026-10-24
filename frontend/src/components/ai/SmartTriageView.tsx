import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Clock,
  Layers,
  Building2,
  Cpu,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { ComplaintCase } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { AiIntelligenceCard } from "./AiIntelligenceCard";

interface SmartTriageViewProps {
  onSelectCaseDetail?: (caseRef: string) => void;
}

export const SmartTriageView: React.FC<SmartTriageViewProps> = ({ onSelectCaseDetail }) => {
  const { currentRole } = useAuth();
  const [cases, setCases] = useState<ComplaintCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCase, setSelectedCase] = useState<ComplaintCase | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const loadTriageCases = async () => {
    setLoading(true);
    try {
      const res = await api.getCases({
        page: 1,
        page_size: 100,
      });

      if (res.success && res.data) {
        setCases(res.data);
        if (res.data.length > 0) {
          // If no selected case or previous case no longer in list, pick the first pending or first overall
          const pending = res.data.find(
            (c) => c.status === "Received" || c.status === "Registered" || c.status === "Under Triage"
          );
          setSelectedCase((prev) => {
            if (prev) {
              const matched = res.data.find((c) => c.case_reference_id === prev.case_reference_id);
              if (matched) return matched;
            }
            return pending || res.data[0];
          });
        }
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTriageCases();
  }, []);

  // Filter logic
  const filteredCases = cases.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.subject.toLowerCase().includes(query) ||
      c.case_reference_id.toLowerCase().includes(query) ||
      (c.institution?.name || "").toLowerCase().includes(query) ||
      (c.category || "").toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (statusFilter === "pending") {
      return c.status === "Received" || c.status === "Registered" || c.status === "Under Triage";
    }
    if (statusFilter === "urgent") {
      return c.priority === "URGENT" || c.priority === "HIGH";
    }
    if (statusFilter === "in_progress") {
      return c.status === "Assigned" || c.status === "In Progress" || c.status === "Under Review";
    }
    return true;
  });

  // KPI Metrics Calculation
  const totalCount = cases.length;
  const pendingCount = cases.filter(
    (c) => c.status === "Received" || c.status === "Registered" || c.status === "Under Triage"
  ).length;
  const urgentCount = cases.filter(
    (c) => c.priority === "URGENT" || c.priority === "HIGH"
  ).length;
  const resolvedCount = cases.filter(
    (c) => c.status === "Resolved" || c.status === "Closed"
  ).length;

  const getPriorityBadgeStyle = (priority: string) => {
    const p = (priority || "").toUpperCase();
    switch (p) {
      case "URGENT":
      case "CRITICAL":
        return {
          bg: "rgba(239, 68, 68, 0.15)",
          color: "#EF4444",
          border: "rgba(239, 68, 68, 0.4)",
        };
      case "HIGH":
        return {
          bg: "rgba(249, 115, 22, 0.15)",
          color: "#F97316",
          border: "rgba(249, 115, 22, 0.4)",
        };
      case "MEDIUM":
        return {
          bg: "rgba(245, 158, 11, 0.15)",
          color: "#F59E0B",
          border: "rgba(245, 158, 11, 0.4)",
        };
      case "LOW":
      default:
        return {
          bg: "rgba(100, 116, 139, 0.15)",
          color: "#94A3B8",
          border: "rgba(100, 116, 139, 0.4)",
        };
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Received":
      case "Registered":
      case "Under Triage":
        return {
          bg: "rgba(245, 158, 11, 0.15)",
          color: "#F59E0B",
          border: "rgba(245, 158, 11, 0.3)",
        };
      case "Assigned":
      case "In Progress":
        return {
          bg: "rgba(59, 130, 246, 0.15)",
          color: "#60A5FA",
          border: "rgba(59, 130, 246, 0.3)",
        };
      case "Resolved":
      case "Closed":
        return {
          bg: "rgba(16, 185, 129, 0.15)",
          color: "#10B981",
          border: "rgba(16, 185, 129, 0.3)",
        };
      case "Rejected":
        return {
          bg: "rgba(239, 68, 68, 0.15)",
          color: "#EF4444",
          border: "rgba(239, 68, 68, 0.3)",
        };
      default:
        return {
          bg: "rgba(148, 163, 184, 0.12)",
          color: "#94A3B8",
          border: "rgba(148, 163, 184, 0.25)",
        };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--accent-aicte-blue, #3b82f6)",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.35rem",
              }}
            >
              <Sparkles size={14} /> AICTE Explainable AI Intelligence & Sentinel
            </div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 900,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Smart Triage & Duplicate Sentinel
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginTop: "0.35rem",
                maxWidth: "750px",
              }}
            >
              Deterministic TF-IDF n-gram vector matching, explainable keyword rationales, and Human-in-the-Loop decision gates for zero-shot grievance routing across statutory bureaus.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={loadTriageCases}
              disabled={loading}
              className="btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                fontSize: "0.8rem",
                padding: "0.55rem 0.95rem",
              }}
              title="Refresh complaint intake stream"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Top Operational KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "1rem",
            marginTop: "0.5rem",
          }}
        >
          {/* Card 1: Total Queue */}
          <div
            className="card-base"
            style={{
              padding: "1rem 1.15rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Cases in Scope
              </span>
              <Layers size={16} color="var(--accent-aicte-blue)" />
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              {totalCount}
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
              {resolvedCount} resolved / closed
            </span>
          </div>

          {/* Card 2: Pending AI Routing */}
          <div
            className="card-base"
            style={{
              padding: "1rem 1.15rem",
              background: "rgba(245, 158, 11, 0.05)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderLeft: "4px solid #F59E0B",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Pending Triage Routing
              </span>
              <Clock size={16} color="#F59E0B" />
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#F59E0B", marginTop: "0.25rem" }}>
              {pendingCount}
            </div>
            <span style={{ fontSize: "0.72rem", color: "rgba(245, 158, 11, 0.85)" }}>
              Awaiting officer verification & dispatch
            </span>
          </div>

          {/* Card 3: Urgent / High SLA */}
          <div
            className="card-base"
            style={{
              padding: "1rem 1.15rem",
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderLeft: "4px solid #EF4444",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                High & Critical Priority
              </span>
              <AlertTriangle size={16} color="#EF4444" />
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#EF4444", marginTop: "0.25rem" }}>
              {urgentCount}
            </div>
            <span style={{ fontSize: "0.72rem", color: "rgba(239, 68, 68, 0.85)" }}>
              Ragging, safety, or legal compliance risk
            </span>
          </div>

          {/* Card 4: AI Engine Engine Status */}
          <div
            className="card-base"
            style={{
              padding: "1rem 1.15rem",
              background: "rgba(59, 130, 246, 0.05)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                AI Vector Sentinel
              </span>
              <Cpu size={16} color="#60A5FA" />
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", display: "inline-block" }}></span>
              Deterministic TF-IDF
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Zero-Shot heuristics &bull; &lt;2ms latency
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card-base"
        style={{
          padding: "0.85rem 1rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          borderRadius: "12px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search complaint text, college name, reference, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem 0.55rem 2.4rem",
              fontSize: "0.8rem",
              background: "var(--bg-main)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              outline: "none",
            }}
          />
        </div>

        {/* Tab Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setStatusFilter("pending")}
            style={{
              padding: "0.45rem 0.85rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: statusFilter === "pending" ? "var(--accent-aicte-blue)" : "var(--border-subtle)",
              background: statusFilter === "pending" ? "var(--accent-aicte-blue)" : "rgba(255, 255, 255, 0.03)",
              color: statusFilter === "pending" ? "#FFF" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Pending Triage ({pendingCount})
          </button>

          <button
            onClick={() => setStatusFilter("urgent")}
            style={{
              padding: "0.45rem 0.85rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: statusFilter === "urgent" ? "#EF4444" : "var(--border-subtle)",
              background: statusFilter === "urgent" ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.03)",
              color: statusFilter === "urgent" ? "#EF4444" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Urgent / High ({urgentCount})
          </button>

          <button
            onClick={() => setStatusFilter("in_progress")}
            style={{
              padding: "0.45rem 0.85rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: statusFilter === "in_progress" ? "#3B82F6" : "var(--border-subtle)",
              background: statusFilter === "in_progress" ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.03)",
              color: statusFilter === "in_progress" ? "#60A5FA" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            In Progress
          </button>

          <button
            onClick={() => setStatusFilter("all")}
            style={{
              padding: "0.45rem 0.85rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: statusFilter === "all" ? "var(--text-primary)" : "var(--border-subtle)",
              background: statusFilter === "all" ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
              color: statusFilter === "all" ? "var(--text-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            All Cases ({totalCount})
          </button>
        </div>
      </div>

      {/* Split Triage Console: Left Queue (5 cols) + Right AI Intelligence Dossier (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue Column (5 cols) */}
        <div
          className="card-base col-span-12 lg:col-span-5"
          style={{
            borderRadius: "14px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "820px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              padding: "0.85rem 1.15rem",
              background: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter size={14} color="var(--accent-aicte-blue)" />
              <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-primary)" }}>
                Intake Stream Queue ({filteredCases.length})
              </span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Select to inspect AI vector match
            </span>
          </div>

          <div
            style={{
              overflowY: "auto",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {filteredCases.length === 0 ? (
              <div
                style={{
                  padding: "3.5rem 1.5rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FileText size={28} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                <span>No complaints match the filter criteria in this view.</span>
              </div>
            ) : (
              filteredCases.map((c) => {
                const isSelected = selectedCase?.case_reference_id === c.case_reference_id;
                const pStyle = getPriorityBadgeStyle(c.priority);
                const sStyle = getStatusBadgeStyle(c.status);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    style={{
                      padding: "1rem 1.15rem",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      borderLeft: isSelected ? "4px solid var(--accent-aicte-blue, #3b82f6)" : "4px solid transparent",
                      background: isSelected
                        ? "rgba(59, 130, 246, 0.1)"
                        : "transparent",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 700,
                          color: isSelected ? "var(--accent-aicte-blue, #60A5FA)" : "var(--text-primary)",
                        }}
                      >
                        {c.case_reference_id}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "4px",
                            background: pStyle.bg,
                            color: pStyle.color,
                            border: `1px solid ${pStyle.border}`,
                          }}
                        >
                          {c.priority}
                        </span>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "4px",
                            background: sStyle.bg,
                            color: sStyle.color,
                            border: `1px solid ${sStyle.border}`,
                          }}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>

                    <h4
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "0.35rem",
                      }}
                    >
                      {c.subject}
                    </h4>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.72rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", overflow: "hidden" }}>
                        <Building2 size={12} style={{ flexShrink: 0, opacity: 0.7 }} />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }}>
                          {c.institution?.name || "Unaffiliated Institution"}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", flexShrink: 0 }}>
                        {new Date(c.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: AI Intelligence & Inspection Panel (7 cols) */}
        <div
          className="col-span-12 lg:col-span-7"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {selectedCase ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Selected Case Quick Summary Card */}
              <div
                className="card-base"
                style={{
                  padding: "1.25rem",
                  borderRadius: "14px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 700,
                          color: "var(--accent-aicte-blue, #60A5FA)",
                          background: "rgba(59, 130, 246, 0.1)",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          border: "1px solid rgba(59, 130, 246, 0.25)",
                        }}
                      >
                        {selectedCase.case_reference_id}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          ...getStatusBadgeStyle(selectedCase.status),
                        }}
                      >
                        {selectedCase.status}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        marginTop: "0.35rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {selectedCase.subject}
                    </h3>
                  </div>

                  {onSelectCaseDetail && (
                    <button
                      onClick={() => onSelectCaseDetail(selectedCase.case_reference_id)}
                      className="btn-secondary"
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "0.45rem 0.85rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        flexShrink: 0,
                      }}
                    >
                      <span>Full Case Dossier</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                {/* Key Attributes Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "0.75rem",
                    padding: "0.85rem 1rem",
                    background: "rgba(0, 0, 0, 0.25)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "10px",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", display: "block" }}>
                      Current Bureau
                    </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {selectedCase.bureau?.name || selectedCase.bureau?.code || "Unassigned (Pending)"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", display: "block" }}>
                      Category
                    </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {selectedCase.category || "Unclassified"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", display: "block" }}>
                      Priority
                    </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {selectedCase.priority}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", display: "block" }}>
                      Institution
                    </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                      {selectedCase.institution?.name || "Unaffiliated"}
                    </span>
                  </div>
                </div>

                {/* Abstract Text View */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                      Grievance Abstract & Narrative
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      lineHeight: 1.6,
                      color: "var(--text-secondary)",
                      background: "rgba(0, 0, 0, 0.2)",
                      padding: "0.85rem 1rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      maxHeight: "130px",
                      overflowY: "auto",
                    }}
                  >
                    {selectedCase.description_confidential || selectedCase.description_redacted || "No narrative details provided."}
                  </div>
                </div>
              </div>

              {/* Explainable AI Intelligence & Duplicate Detection Card */}
              <AiIntelligenceCard
                currentCase={selectedCase}
                userRole={currentRole}
                onTriageApplied={() => {
                  loadTriageCases();
                  api.getCaseDetail(selectedCase.case_reference_id).then((res) => {
                    if (res.success && res.data) {
                      setSelectedCase(res.data);
                    }
                  });
                }}
              />
            </div>
          ) : (
            <div
              className="card-base"
              style={{
                borderRadius: "14px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                padding: "3.5rem 1.5rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <Sparkles size={36} color="var(--accent-aicte-blue)" style={{ margin: "0 auto 1rem auto", opacity: 0.8 }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Select a Grievance from Queue
              </h3>
              <p style={{ fontSize: "0.82rem", maxWidth: "400px", margin: "0 auto" }}>
                Select any incoming complaint case on the left to evaluate automated bureau routing recommendations, explainable keywords, and vector duplicate clusters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
