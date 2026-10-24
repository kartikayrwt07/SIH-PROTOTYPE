import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Layers, Search, CheckCircle, AlertTriangle, ChevronRight,
  Zap, Users, TrendingUp, ArrowRight, X, Check, RefreshCw, Sparkles,
  Timer, ExternalLink, ShieldCheck,
} from "lucide-react";
import { api } from "../../services/api";
import type {
  AutoDetectResponse,
  DetectedGroup,
  MasterTicketSummary,
  MasterTicketRead,
  MasterTicketStats,
} from "../../types";

interface MasterTicketHubProps {
  onSelectCase?: (caseRef: string) => void;
}

type SubTab = "clusters" | "tickets";

export const MasterTicketHub: React.FC<MasterTicketHubProps> = ({ onSelectCase }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("clusters");
  const [stats, setStats] = useState<MasterTicketStats | null>(null);
  const [tickets, setTickets] = useState<MasterTicketSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [detectedGroups, setDetectedGroups] = useState<AutoDetectResponse | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<MasterTicketRead | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [resolveRemarks, setResolveRemarks] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.70);
  const [minGroupSize, setMinGroupSize] = useState(2);

  const isInitialMount = useRef(true);

  // Fetch created master tickets & stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        api.getMasterTicketStats(),
        api.listMasterTickets(statusFilter || undefined),
      ]);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (ticketsRes.success && ticketsRes.data) setTickets(ticketsRes.data);
    } catch (e) {
      console.error("Failed to load master ticket data:", e);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Run AI duplicate cluster scan
  const runDetection = useCallback(async (currThreshold: number, currMinSize: number) => {
    setDetecting(true);
    setErrorMsg(null);
    try {
      const res = await api.detectDuplicateGroups({
        similarity_threshold: currThreshold,
        min_group_size: currMinSize,
      });
      if (res.success && res.data) {
        setDetectedGroups(res.data);
      } else if (res.error) {
        setErrorMsg(res.error.message || "Failed to scan clusters");
      }
    } catch (e) {
      console.error("Detection scan failed:", e);
      setErrorMsg("Cluster detection service is currently unavailable.");
    } finally {
      setDetecting(false);
    }
  }, []);

  // Run detection on mount
  useEffect(() => {
    runDetection(threshold, minGroupSize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scan on slider / min-size change with debounce
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      runDetection(threshold, minGroupSize);
    }, 350);
    return () => clearTimeout(timer);
  }, [threshold, minGroupSize, runDetection]);

  const handleCreateMasterTicket = async (group: DetectedGroup) => {
    setCreating(group.anchor_case_reference_id);
    try {
      const res = await api.createMasterTicket({
        case_reference_ids: group.member_case_refs,
        consolidated_subject: `${group.category} Cluster — ${group.institution_name}`,
      });
      if (res.success && res.data) {
        setSuccessMsg(`✓ Created Master Ticket ${res.data.ticket_reference_id} with ${res.data.child_count} complaints linked!`);
        setTimeout(() => setSuccessMsg(null), 6000);
        // Refresh both stats & detection
        await Promise.all([
          fetchData(),
          runDetection(threshold, minGroupSize),
        ]);
        // Open the newly created ticket directly
        await handleViewDetail(res.data.ticket_reference_id);
      } else if (res.error) {
        setErrorMsg(res.error.message || "Failed to create master ticket");
      }
    } catch (e) {
      console.error("Failed to create master ticket:", e);
      setErrorMsg("Error creating master ticket.");
    } finally {
      setCreating(null);
    }
  };

  const handleViewDetail = async (ticketRef: string) => {
    setLoading(true);
    try {
      const res = await api.getMasterTicketDetail(ticketRef);
      if (res.success && res.data) {
        setSelectedTicket(res.data);
      }
    } catch (e) {
      console.error("Failed to load ticket detail:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket || !resolveRemarks.trim()) return;
    setResolving(true);
    try {
      const res = await api.resolveMasterTicket(selectedTicket.ticket_reference_id, {
        resolution_remarks: resolveRemarks,
        child_status: "Resolved",
      });
      if (res.success && res.data) {
        setSuccessMsg(
          `✓ ${res.data.children_resolved} complaints resolved simultaneously! ` +
          `Time saved: ${res.data.total_time_saved_hours.toFixed(1)} hours.`
        );
        setTimeout(() => setSuccessMsg(null), 8000);
        setResolveRemarks("");
        // Refresh detail, stats and active list
        await Promise.all([
          handleViewDetail(selectedTicket.ticket_reference_id),
          fetchData(),
        ]);
      } else if (res.error) {
        setErrorMsg(res.error.message || "Failed to resolve master ticket");
      }
    } catch (e) {
      console.error("Failed to resolve ticket:", e);
      setErrorMsg("Error resolving master ticket.");
    } finally {
      setResolving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "#3B82F6";
      case "In Progress": return "#F59E0B";
      case "Resolved": return "#10B981";
      case "Closed": return "#6B7280";
      default: return "#94A3B8";
    }
  };

  // ─────── Alerts / Notifications ───────
  const renderAlerts = () => (
    <>
      {successMsg && (
        <div style={{
          position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 9999,
          background: "linear-gradient(135deg, #059669, #10B981)",
          color: "#fff", padding: "1rem 1.5rem", borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(16,185,129,0.4)",
          display: "flex", alignItems: "center", gap: "0.75rem",
          animation: "slideInRight 0.3s ease",
          maxWidth: "500px", fontSize: "0.9rem", fontWeight: 600,
        }}>
          <CheckCircle size={20} />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} style={{
            background: "none", border: "none", color: "#fff", cursor: "pointer",
            marginLeft: "auto", padding: "0.25rem",
          }}>
            <X size={16} />
          </button>
        </div>
      )}
      {errorMsg && (
        <div style={{
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#FCA5A5", padding: "0.75rem 1rem", borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: "0.85rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={18} color="#EF4444" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} style={{ background: "none", border: "none", color: "#FCA5A5", cursor: "pointer" }}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );

  // ─────── KPI Dashboard ───────
  const renderStatsCards = () => {
    const kpis = [
      { label: "Master Tickets", value: stats?.total_master_tickets ?? 0, icon: Layers, color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
      { label: "Open", value: stats?.open_tickets ?? 0, icon: AlertTriangle, color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
      { label: "Resolved", value: stats?.resolved_tickets ?? 0, icon: CheckCircle, color: "#10B981", bg: "rgba(16,185,129,0.12)" },
      { label: "Grouped Cases", value: stats?.total_children_grouped ?? 0, icon: Users, color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
      { label: "Hours Saved", value: `${(stats?.total_time_saved_hours ?? 0).toFixed(1)}h`, icon: Timer, color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
      { label: "Avg Group Size", value: (stats?.avg_group_size ?? 0).toFixed(1), icon: TrendingUp, color: "#06B6D4", bg: "rgba(6,182,212,0.12)" },
    ];

    return (
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "1rem", marginBottom: "1rem",
      }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px", padding: "1.1rem",
              display: "flex", flexDirection: "column", gap: "0.4rem",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = kpi.color;
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
              (e.currentTarget as HTMLElement).style.transform = "none";
            }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "8px",
                  background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={17} color={kpi.color} />
                </div>
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {kpi.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─────── Scanner Controls ───────
  const renderDetectionPanel = () => (
    <div className="glass-panel" style={{ borderLeft: "4px solid #8B5CF6", marginBottom: "1.25rem", padding: "1.25rem" }}>
      <div className="panel-header" style={{ marginBottom: "1rem" }}>
        <div>
          <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Search size={18} color="#8B5CF6" />
            <span>AI Duplicate Cluster Scanner</span>
            {detecting && (
              <span style={{
                background: "rgba(139,92,246,0.15)", color: "#A78BFA",
                padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.72rem",
                display: "inline-flex", alignItems: "center", gap: "0.3rem", fontWeight: 600
              }}>
                <RefreshCw size={12} className="spin" /> Scanning complaints...
              </span>
            )}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
            Real-time dense vector clustering across active grievances from the same institution and category
          </div>
        </div>
        <button
          onClick={() => runDetection(threshold, minGroupSize)}
          disabled={detecting}
          style={{
            background: detecting ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #7C3AED, #8B5CF6)",
            color: "#fff", border: "none", padding: "0.55rem 1.1rem",
            borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700,
            cursor: detecting ? "wait" : "pointer",
            display: "flex", alignItems: "center", gap: "0.45rem",
            transition: "all 0.2s ease",
          }}
        >
          {detecting ? <RefreshCw size={15} className="spin" /> : <Sparkles size={15} />}
          {detecting ? "Scanning..." : "Rescan Now"}
        </button>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1.5rem", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "10px",
      }}>
        {/* Similarity Threshold Slider */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
              Similarity Threshold
            </label>
            <span style={{
              fontSize: "0.85rem", fontWeight: 800, color: "#A78BFA",
              background: "rgba(139,92,246,0.15)", padding: "0.1rem 0.5rem", borderRadius: "6px"
            }}>
              {(threshold * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range" min={0.50} max={0.95} step={0.01}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#8B5CF6", cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)" }}>
            <span>50% (Loose)</span>
            <span>70% (Balanced)</span>
            <span>95% (Exact)</span>
          </div>
        </div>

        {/* Min Group Size */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
              Min Group Size
            </label>
            <span style={{
              fontSize: "0.85rem", fontWeight: 800, color: "#60A5FA",
              background: "rgba(59,130,246,0.15)", padding: "0.1rem 0.5rem", borderRadius: "6px"
            }}>
              {minGroupSize} complaints
            </span>
          </div>
          <input
            type="range" min={2} max={10} step={1}
            value={minGroupSize}
            onChange={(e) => setMinGroupSize(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "#3B82F6", cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)" }}>
            <span>2 (Pairs)</span>
            <span>5 (Medium clusters)</span>
            <span>10+ (Large systemic)</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────── Detected Groups List ───────
  const renderDetectedGroups = () => {
    if (detecting && !detectedGroups) {
      return (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          <RefreshCw size={24} className="spin" style={{ margin: "0 auto 0.75rem", display: "block", color: "#8B5CF6" }} />
          Running dense vector clustering on active complaints...
        </div>
      );
    }

    if (!detectedGroups) return null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Summary Bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
          background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.08))",
          borderRadius: "10px", padding: "0.9rem 1.25rem",
          border: "1px solid rgba(139,92,246,0.2)",
        }}>
          <Zap size={20} color="#8B5CF6" />
          <div style={{ flex: 1, minWidth: "220px" }}>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#FFFFFF" }}>
              {detectedGroups.groups_detected} cluster{detectedGroups.groups_detected !== 1 ? "s" : ""} detected
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "0.75rem" }}>
              {detectedGroups.total_groupable_cases} complaints eligible for grouping across {detectedGroups.total_cases_scanned} scanned
            </span>
          </div>
          <div style={{
            background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.3)",
            borderRadius: "8px", padding: "0.35rem 0.75rem",
          }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#EC4899" }}>
              ~{detectedGroups.estimated_time_saved_hours.toFixed(1)}h potential administrative time saved
            </span>
          </div>
        </div>

        {detectedGroups.groups.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "3rem 1.5rem",
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            borderRadius: "12px", color: "var(--text-muted)", fontSize: "0.9rem",
          }}>
            <AlertTriangle size={24} color="#F59E0B" style={{ margin: "0 auto 0.5rem", display: "block" }} />
            <div style={{ fontWeight: 600, color: "#E2E8F0", marginBottom: "0.25rem" }}>
              No clusters detected at {(threshold * 100).toFixed(0)}% similarity (min size {minGroupSize})
            </div>
            <div>
              Try moving the slider to the left (e.g. 60%-70%) to detect broader semantic grievance patterns.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {detectedGroups.groups.map((group, idx) => {
              const isBeingCreated = creating === group.anchor_case_reference_id;
              return (
                <div
                  key={group.anchor_case_reference_id}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "12px", padding: "1.25rem",
                    borderLeft: "4px solid #8B5CF6",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#8B5CF6";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(139,92,246,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "280px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{
                          background: "rgba(139,92,246,0.15)", color: "#A78BFA",
                          padding: "0.2rem 0.5rem", borderRadius: "6px",
                          fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em",
                        }}>
                          CLUSTER #{idx + 1}
                        </span>
                        <span style={{
                          background: "rgba(59,130,246,0.12)", color: "#60A5FA",
                          padding: "0.2rem 0.5rem", borderRadius: "6px",
                          fontSize: "0.7rem", fontWeight: 700,
                        }}>
                          {group.bureau_code}
                        </span>
                        <span style={{
                          background: "rgba(245,158,11,0.12)", color: "#FBBF24",
                          padding: "0.2rem 0.5rem", borderRadius: "6px",
                          fontSize: "0.7rem", fontWeight: 600,
                        }}>
                          {group.category}
                        </span>
                        <span style={{
                          background: "rgba(16,185,129,0.12)", color: "#34D399",
                          padding: "0.2rem 0.5rem", borderRadius: "6px",
                          fontSize: "0.7rem", fontWeight: 700,
                        }}>
                          {(group.avg_similarity * 100).toFixed(0)}% Similarity
                        </span>
                      </div>

                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.3rem" }}>
                        {group.anchor_subject}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                        <span style={{ color: "#E2E8F0", fontWeight: 600 }}>{group.institution_name}</span>
                        {group.institution_aicte_id !== "N/A" && ` (${group.institution_aicte_id})`} &bull; {group.member_count} students/complainants affected
                      </div>

                      {/* Common Keywords */}
                      {group.common_keywords.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.6rem" }}>
                          {group.common_keywords.map((kw) => (
                            <span key={kw} style={{
                              background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
                              color: "#C4B5FD", padding: "0.15rem 0.4rem", borderRadius: "4px",
                              fontSize: "0.7rem", fontFamily: "var(--font-mono)",
                            }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Member Case Refs */}
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        Cases: {group.member_case_refs.slice(0, 5).join(", ")}
                        {group.member_case_refs.length > 5 && ` +${group.member_case_refs.length - 5} more`}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                      <div style={{
                        background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                        color: "#fff", borderRadius: "10px", padding: "0.5rem 0.85rem",
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, lineHeight: 1 }}>{group.member_count}</div>
                        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.9 }}>Complaints</div>
                      </div>

                      <button
                        onClick={() => handleCreateMasterTicket(group)}
                        disabled={isBeingCreated}
                        style={{
                          background: isBeingCreated ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #059669, #10B981)",
                          color: "#fff", border: "none", padding: "0.55rem 1rem",
                          borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700,
                          cursor: isBeingCreated ? "wait" : "pointer",
                          display: "flex", alignItems: "center", gap: "0.4rem",
                          boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                        }}
                      >
                        {isBeingCreated ? <RefreshCw size={14} className="spin" /> : <Layers size={14} />}
                        {isBeingCreated ? "Forming Group..." : "Form Master Ticket"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─────── Ticket List ───────
  const renderTicketList = () => (
    <div className="glass-panel" style={{ borderLeft: "4px solid #3B82F6", padding: "1.25rem" }}>
      <div className="panel-header" style={{ marginBottom: "1rem" }}>
        <div>
          <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Layers size={18} color="#3B82F6" />
            <span>Master Tickets Catalog</span>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
            Consolidated tickets representing grouped grievances with single-click bulk resolution
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {["", "Open", "Resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                background: statusFilter === f ? "rgba(59,130,246,0.2)" : "transparent",
                border: `1px solid ${statusFilter === f ? "#3B82F6" : "var(--border-subtle)"}`,
                color: statusFilter === f ? "#60A5FA" : "var(--text-muted)",
                padding: "0.3rem 0.7rem", borderRadius: "6px",
                fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {f || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading && tickets.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          <RefreshCw size={20} className="spin" style={{ margin: "0 auto 0.5rem", display: "block", color: "#3B82F6" }} />
          Loading master tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", fontSize: "0.85rem",
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "10px"
        }}>
          No master tickets created yet. Use the "Detected Clusters" tab to form your first Master Ticket!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => handleViewDetail(ticket.ticket_reference_id)}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px", padding: "1rem 1.25rem",
                cursor: "pointer", transition: "all 0.2s ease",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6";
                (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.82rem",
                    color: "#60A5FA", background: "rgba(59,130,246,0.12)",
                    padding: "0.15rem 0.5rem", borderRadius: "4px",
                  }}>
                    {ticket.ticket_reference_id}
                  </span>
                  <span style={{
                    background: `${getStatusColor(ticket.status)}20`,
                    color: getStatusColor(ticket.status),
                    padding: "0.15rem 0.5rem", borderRadius: "10px",
                    fontSize: "0.72rem", fontWeight: 700,
                  }}>
                    {ticket.status}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {ticket.bureau_code} &bull; {ticket.category}
                  </span>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#FFFFFF", marginBottom: "0.2rem" }}>
                  {ticket.consolidated_subject}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  {ticket.institution_name} &bull; {ticket.child_count} grouped complaints &bull; {ticket.time_saved_hours.toFixed(1)}h time saved
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFFFFF" }}>
                    {ticket.child_count}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Complaints
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─────── Ticket Detail View & Cascading Resolver ───────
  const renderDetailView = () => {
    if (!selectedTicket) return null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 800,
                color: "#60A5FA", background: "rgba(59,130,246,0.15)",
                padding: "0.25rem 0.75rem", borderRadius: "6px",
              }}>
                {selectedTicket.ticket_reference_id}
              </span>
              <span style={{
                background: `${getStatusColor(selectedTicket.status)}25`,
                color: getStatusColor(selectedTicket.status),
                padding: "0.25rem 0.75rem", borderRadius: "12px",
                fontSize: "0.8rem", fontWeight: 700,
              }}>
                {selectedTicket.status}
              </span>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#FFFFFF", margin: "0.2rem 0" }}>
              {selectedTicket.consolidated_subject}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
              {selectedTicket.institution_name} &bull; Bureau: {selectedTicket.bureau_name} ({selectedTicket.bureau_code}) &bull; Category: {selectedTicket.category}
            </p>
          </div>

          <button
            onClick={() => setSelectedTicket(null)}
            style={{
              background: "none", border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)", padding: "0.5rem 1rem",
              borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
            }}
          >
            <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Tickets
          </button>
        </div>

        {/* Resolution Banner if already resolved */}
        {selectedTicket.status === "Resolved" && (
          <div style={{
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "10px", padding: "1rem 1.25rem",
            display: "flex", alignItems: "flex-start", gap: "0.75rem",
          }}>
            <ShieldCheck size={20} color="#10B981" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 700, color: "#10B981", fontSize: "0.9rem" }}>
                Master Ticket Resolved &bull; Cascaded to All {selectedTicket.child_count} Complaints
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {selectedTicket.resolution_remarks}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.3rem" }}>
                Total administrative time saved: {selectedTicket.time_saved_hours.toFixed(1)} hours
              </div>
            </div>
          </div>
        )}

        {/* Resolve Cascading Action Box (if open) */}
        {selectedTicket.status !== "Resolved" && selectedTicket.status !== "Closed" && (
          <div className="glass-panel" style={{ borderLeft: "4px solid #10B981", padding: "1.25rem" }}>
            <div style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "1rem", marginBottom: "0.3rem" }}>
              Resolve Master Ticket (Cascade to {selectedTicket.child_count} Students)
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "0.75rem" }}>
              Submitting resolution here will automatically mark all {selectedTicket.child_count} student complaints as <strong>Resolved</strong>, log timeline audit events, and append official resolution remarks to their dossiers.
            </p>
            <textarea
              value={resolveRemarks}
              onChange={(e) => setResolveRemarks(e.target.value)}
              placeholder="e.g. AICTE directive issued to institution. Unapproved fee collection reversed and student fees refunded..."
              rows={3}
              style={{
                width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: "8px", padding: "0.75rem", color: "#fff", fontSize: "0.85rem",
                marginBottom: "0.75rem", resize: "vertical",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleResolve}
                disabled={resolving || !resolveRemarks.trim()}
                style={{
                  background: resolving || !resolveRemarks.trim()
                    ? "rgba(16,185,129,0.3)"
                    : "linear-gradient(135deg, #059669, #10B981)",
                  color: "#fff", border: "none", padding: "0.6rem 1.5rem",
                  borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700,
                  cursor: resolving || !resolveRemarks.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                }}
              >
                {resolving ? <RefreshCw size={15} className="spin" /> : <Check size={15} />}
                {resolving ? "Cascading Resolution..." : `Resolve All ${selectedTicket.child_count} Complaints`}
              </button>
            </div>
          </div>
        )}

        {/* Child Complaints Table */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "0.95rem", marginBottom: "0.75rem" }}>
            Linked Complaints ({selectedTicket.children.length})
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", textAlign: "left" }}>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Case ID</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Subject</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Status</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Similarity</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Role</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedTicket.children.map((child) => (
                  <tr key={child.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.6rem 0.75rem", fontFamily: "var(--font-mono)", color: "#60A5FA" }}>
                      {child.case_reference_id}
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem", color: "#FFFFFF", maxWidth: "300px" }}>
                      {child.subject}
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      <span style={{
                        background: `${getStatusColor(child.status)}20`,
                        color: getStatusColor(child.status),
                        padding: "0.15rem 0.5rem", borderRadius: "10px",
                        fontSize: "0.72rem", fontWeight: 700,
                      }}>
                        {child.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <div style={{
                          width: "60px", height: "6px", background: "rgba(255,255,255,0.1)",
                          borderRadius: "3px", overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${child.similarity_score * 100}%`,
                            height: "100%", background: "#8B5CF6",
                          }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#A78BFA" }}>
                          {(child.similarity_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      {child.is_anchor ? (
                        <span style={{
                          background: "rgba(245,158,11,0.15)", color: "#FBBF24",
                          padding: "0.15rem 0.45rem", borderRadius: "4px",
                          fontSize: "0.7rem", fontWeight: 700,
                        }}>
                          ★ Anchor Case
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                          Linked Child
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      {onSelectCase && (
                        <button
                          onClick={() => onSelectCase(child.case_reference_id)}
                          style={{
                            background: "transparent", border: "1px solid var(--border-subtle)",
                            color: "var(--text-secondary)", padding: "0.2rem 0.5rem",
                            borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: "0.3rem",
                          }}
                        >
                          <ExternalLink size={11} /> Dossier
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ─────── MAIN RENDER ───────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {renderAlerts()}

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
            Smart Duplicate Grouping (Master Tickets)
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            AI-powered semantic clustering groups 15+ student complaints from the same college into 1 Master Ticket. Resolving once resolves all.
          </p>
        </div>
      </div>

      {selectedTicket ? (
        renderDetailView()
      ) : (
        <>
          {renderStatsCards()}

          {/* Sub-Tabs: Detected Clusters vs Created Master Tickets */}
          <div style={{
            display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "0.5rem", marginTop: "0.5rem",
          }}>
            <button
              onClick={() => setActiveSubTab("clusters")}
              style={{
                background: activeSubTab === "clusters" ? "rgba(139,92,246,0.15)" : "transparent",
                color: activeSubTab === "clusters" ? "#C4B5FD" : "var(--text-muted)",
                border: `1px solid ${activeSubTab === "clusters" ? "#8B5CF6" : "transparent"}`,
                padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
                transition: "all 0.2s ease",
              }}
            >
              <Sparkles size={16} color={activeSubTab === "clusters" ? "#A78BFA" : "currentColor"} />
              <span>AI Detected Clusters ({detectedGroups?.groups_detected ?? 0})</span>
            </button>

            <button
              onClick={() => setActiveSubTab("tickets")}
              style={{
                background: activeSubTab === "tickets" ? "rgba(59,130,246,0.15)" : "transparent",
                color: activeSubTab === "tickets" ? "#93C5FD" : "var(--text-muted)",
                border: `1px solid ${activeSubTab === "tickets" ? "#3B82F6" : "transparent"}`,
                padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
                transition: "all 0.2s ease",
              }}
            >
              <Layers size={16} color={activeSubTab === "tickets" ? "#60A5FA" : "currentColor"} />
              <span>Created Master Tickets ({tickets.length})</span>
            </button>
          </div>

          {activeSubTab === "clusters" ? (
            <>
              {renderDetectionPanel()}
              {renderDetectedGroups()}
            </>
          ) : (
            renderTicketList()
          )}
        </>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};
