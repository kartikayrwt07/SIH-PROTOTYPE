import React, { useState, useEffect, useCallback } from "react";
import {
  Layers, Search, CheckCircle, AlertTriangle, ChevronRight,
  Zap, Users, TrendingUp, ArrowRight, X, Check, RefreshCw, Sparkles,
  Link2, Timer, ExternalLink,
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

type ViewMode = "overview" | "detect" | "detail";

export const MasterTicketHub: React.FC<MasterTicketHubProps> = ({ onSelectCase }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [stats, setStats] = useState<MasterTicketStats | null>(null);
  const [tickets, setTickets] = useState<MasterTicketSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [detectedGroups, setDetectedGroups] = useState<AutoDetectResponse | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<MasterTicketRead | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [creating, setCreating] = useState<string | null>(null); // anchor ref of group being created
  const [resolveRemarks, setResolveRemarks] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.78);
  const [minGroupSize, setMinGroupSize] = useState(3);

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

  const handleDetect = async () => {
    setDetecting(true);
    setDetectedGroups(null);
    try {
      const res = await api.detectDuplicateGroups({
        similarity_threshold: threshold,
        min_group_size: minGroupSize,
      });
      if (res.success && res.data) {
        setDetectedGroups(res.data);
        setViewMode("detect");
      }
    } catch (e) {
      console.error("Detection failed:", e);
    }
    setDetecting(false);
  };

  const handleCreateMasterTicket = async (group: DetectedGroup) => {
    setCreating(group.anchor_case_reference_id);
    try {
      const res = await api.createMasterTicket({
        case_reference_ids: group.member_case_refs,
      });
      if (res.success && res.data) {
        setSuccessMsg(res.data.message);
        setTimeout(() => setSuccessMsg(null), 5000);
        // Remove this group from detected
        if (detectedGroups) {
          setDetectedGroups({
            ...detectedGroups,
            groups: detectedGroups.groups.filter(
              g => g.anchor_case_reference_id !== group.anchor_case_reference_id
            ),
            groups_detected: detectedGroups.groups_detected - 1,
          });
        }
        await fetchData();
      }
    } catch (e) {
      console.error("Failed to create master ticket:", e);
    }
    setCreating(null);
  };

  const handleViewDetail = async (ticketRef: string) => {
    setLoading(true);
    try {
      const res = await api.getMasterTicketDetail(ticketRef);
      if (res.success && res.data) {
        setSelectedTicket(res.data);
        setViewMode("detail");
      }
    } catch (e) {
      console.error("Failed to load ticket detail:", e);
    }
    setLoading(false);
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
        // Refresh detail
        await handleViewDetail(selectedTicket.ticket_reference_id);
        await fetchData();
      }
    } catch (e) {
      console.error("Resolution failed:", e);
    }
    setResolving(false);
    setResolveRemarks("");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "Open": return "#3B82F6";
      case "In Progress": return "#F59E0B";
      case "Resolved": return "#10B981";
      case "Closed": return "#6B7280";
      default: return "#94A3B8";
    }
  };

  // ─────── Success Toast ───────
  const renderSuccessToast = () => {
    if (!successMsg) return null;
    return (
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
    );
  };

  // ─────── Stats KPI Cards ───────
  const renderStatsCards = () => {
    if (!stats) return null;
    const kpis = [
      { label: "Master Tickets", value: stats.total_master_tickets, icon: Layers, color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
      { label: "Open", value: stats.open_tickets, icon: AlertTriangle, color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
      { label: "Resolved", value: stats.resolved_tickets, icon: CheckCircle, color: "#10B981", bg: "rgba(16,185,129,0.12)" },
      { label: "Cases Grouped", value: stats.total_children_grouped, icon: Users, color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
      { label: "Hours Saved", value: `${stats.total_time_saved_hours.toFixed(1)}h`, icon: Timer, color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
      { label: "Avg Group Size", value: stats.avg_group_size.toFixed(1), icon: TrendingUp, color: "#06B6D4", bg: "rgba(6,182,212,0.12)" },
    ];

    return (
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: "1rem", marginBottom: "1.5rem",
      }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px", padding: "1.25rem",
              display: "flex", flexDirection: "column", gap: "0.5rem",
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
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} color={kpi.color} />
                </div>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {kpi.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─────── Detection Controls ───────
  const renderDetectionPanel = () => (
    <div className="glass-panel" style={{ borderLeft: "4px solid #8B5CF6", marginBottom: "1.5rem" }}>
      <div className="panel-header">
        <div>
          <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Search size={18} color="#8B5CF6" />
            <span>AI Duplicate Cluster Scanner</span>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
            Scans active complaints using dense semantic similarity to detect groupable clusters
          </div>
        </div>
        <button
          onClick={handleDetect}
          disabled={detecting}
          style={{
            background: detecting ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #7C3AED, #8B5CF6)",
            color: "#fff", border: "none", padding: "0.6rem 1.25rem",
            borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700,
            cursor: detecting ? "wait" : "pointer",
            display: "flex", alignItems: "center", gap: "0.5rem",
            transition: "all 0.2s ease",
          }}
        >
          {detecting ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
          {detecting ? "Scanning..." : "Run Detection Scan"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Similarity Threshold
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="range" min={0.5} max={0.95} step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              style={{ width: "140px", accentColor: "#8B5CF6" }}
            />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#8B5CF6", minWidth: "40px" }}>
              {(threshold * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Min Group Size
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="number" min={2} max={50} value={minGroupSize}
              onChange={(e) => setMinGroupSize(parseInt(e.target.value) || 3)}
              style={{
                width: "60px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: "6px", padding: "0.4rem 0.5rem", color: "#fff", fontSize: "0.85rem", textAlign: "center",
              }}
            />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>complaints</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────── Detected Groups List ───────
  const renderDetectedGroups = () => {
    if (!detectedGroups) return null;

    return (
      <div style={{ marginBottom: "1.5rem" }}>
        {/* Summary Bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: "1rem",
          background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.08))",
          borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1rem",
          border: "1px solid rgba(139,92,246,0.2)",
        }}>
          <Zap size={20} color="#8B5CF6" />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#FFFFFF" }}>
              {detectedGroups.groups_detected} group{detectedGroups.groups_detected !== 1 ? "s" : ""} detected
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "0.75rem" }}>
              from {detectedGroups.total_cases_scanned} scanned cases •{" "}
              {detectedGroups.total_groupable_cases} groupable complaints
            </span>
          </div>
          <div style={{
            background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.3)",
            borderRadius: "8px", padding: "0.4rem 0.8rem",
          }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#EC4899" }}>
              ~{detectedGroups.estimated_time_saved_hours.toFixed(1)}h savings potential
            </span>
          </div>
        </div>

        {detectedGroups.groups.length === 0 && (
          <div style={{
            textAlign: "center", padding: "3rem", color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}>
            No duplicate clusters detected at the current threshold. Try lowering the similarity threshold.
          </div>
        )}

        {/* Group Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {detectedGroups.groups.map((group, idx) => (
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
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(139,92,246,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{
                      background: "rgba(139,92,246,0.15)", color: "#A78BFA",
                      padding: "0.2rem 0.5rem", borderRadius: "6px",
                      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em",
                    }}>
                      GROUP #{idx + 1}
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
                  </div>

                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.3rem" }}>
                    {group.anchor_subject}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                    {group.institution_name} • {group.member_count} complaints • Avg similarity: {(group.avg_similarity * 100).toFixed(0)}%
                  </div>

                  {/* Keywords */}
                  {group.common_keywords.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
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

                  {/* Member case refs (collapsed preview) */}
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
                    Cases: {group.member_case_refs.slice(0, 5).join(", ")}
                    {group.member_case_refs.length > 5 && ` +${group.member_case_refs.length - 5} more`}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                  {/* Member count badge */}
                  <div style={{
                    background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                    color: "#fff", borderRadius: "10px", padding: "0.6rem 1rem",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{group.member_count}</div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      complaints
                    </div>
                  </div>

                  {/* Time savings estimate */}
                  <div style={{
                    fontSize: "0.75rem", color: "#EC4899", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: "0.3rem",
                  }}>
                    <Timer size={12} />
                    ~{((group.member_count * 12) / 60).toFixed(1)}h saved
                  </div>

                  {/* Create button */}
                  <button
                    onClick={() => handleCreateMasterTicket(group)}
                    disabled={creating === group.anchor_case_reference_id}
                    style={{
                      background: creating === group.anchor_case_reference_id
                        ? "rgba(16,185,129,0.3)"
                        : "linear-gradient(135deg, #059669, #10B981)",
                      color: "#fff", border: "none", padding: "0.5rem 1rem",
                      borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700,
                      cursor: creating === group.anchor_case_reference_id ? "wait" : "pointer",
                      display: "flex", alignItems: "center", gap: "0.4rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {creating === group.anchor_case_reference_id ? (
                      <><RefreshCw size={14} className="spin" /> Creating...</>
                    ) : (
                      <><Layers size={14} /> Create Master Ticket</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─────── Ticket List ───────
  const renderTicketList = () => (
    <div className="glass-panel" style={{ borderLeft: "4px solid #3B82F6" }}>
      <div className="panel-header">
        <div>
          <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Layers size={18} color="#3B82F6" />
            <span>Master Tickets</span>
            {loading && <RefreshCw size={14} className="spin" style={{ marginLeft: "0.5rem", color: "var(--text-muted)" }} />}
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
                padding: "0.3rem 0.6rem", borderRadius: "6px",
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
        <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          No master tickets yet. Run the AI scanner to detect groupable complaint clusters.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => handleViewDetail(ticket.ticket_reference_id)}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px", padding: "1rem 1.25rem",
                cursor: "pointer", transition: "all 0.2s ease",
                display: "flex", alignItems: "center", gap: "1rem",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6";
                (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
            >
              {/* Count badge */}
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#A78BFA" }}>{ticket.child_count}</span>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>cases</span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "#A78BFA", fontWeight: 700 }}>
                    {ticket.ticket_reference_id}
                  </span>
                  <span style={{
                    background: `${statusColor(ticket.status)}20`,
                    color: statusColor(ticket.status),
                    padding: "0.1rem 0.4rem", borderRadius: "4px",
                    fontSize: "0.68rem", fontWeight: 700,
                  }}>
                    {ticket.status}
                  </span>
                  <span style={{
                    background: "rgba(245,158,11,0.1)", color: "#FBBF24",
                    padding: "0.1rem 0.4rem", borderRadius: "4px",
                    fontSize: "0.68rem", fontWeight: 600,
                  }}>
                    {ticket.category}
                  </span>
                </div>
                <div style={{
                  fontSize: "0.88rem", fontWeight: 600, color: "#FFFFFF",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {ticket.consolidated_subject}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                  {ticket.institution_name} • {ticket.bureau_name} • {formatDate(ticket.created_at)}
                </div>
              </div>

              {/* Right side */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                {ticket.time_saved_hours > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.25rem",
                    fontSize: "0.78rem", color: "#EC4899", fontWeight: 600,
                  }}>
                    <Timer size={13} />
                    {ticket.time_saved_hours.toFixed(1)}h
                  </div>
                )}
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─────── Detail View ───────
  const renderDetailView = () => {
    if (!selectedTicket) return null;
    const t = selectedTicket;

    return (
      <div>
        {/* Back button */}
        <button
          onClick={() => { setViewMode("overview"); setSelectedTicket(null); }}
          style={{
            background: "none", border: "none", color: "var(--text-secondary)",
            cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
            display: "flex", alignItems: "center", gap: "0.4rem",
            marginBottom: "1rem", padding: "0.4rem 0",
          }}
        >
          <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Master Tickets
        </button>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.06))",
          borderRadius: "16px", padding: "1.5rem",
          border: "1px solid rgba(139,92,246,0.2)",
          marginBottom: "1.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.85rem",
                  fontWeight: 800, color: "#A78BFA",
                }}>
                  {t.ticket_reference_id}
                </span>
                <span style={{
                  background: `${statusColor(t.status)}20`,
                  color: statusColor(t.status),
                  padding: "0.2rem 0.6rem", borderRadius: "6px",
                  fontSize: "0.75rem", fontWeight: 700,
                }}>
                  {t.status}
                </span>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "0.3rem" }}>
                {t.consolidated_subject}
              </h3>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {t.institution_name} ({t.institution_aicte_id}) • {t.bureau_name} • {t.category}
              </div>
            </div>

            {/* Big stats */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{
                background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                borderRadius: "12px", padding: "1rem 1.5rem", textAlign: "center",
              }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff" }}>{t.child_count}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", fontWeight: 600, textTransform: "uppercase" }}>
                  Grouped Complaints
                </div>
              </div>
              <div style={{
                background: "linear-gradient(135deg, #BE185D, #EC4899)",
                borderRadius: "12px", padding: "1rem 1.5rem", textAlign: "center",
              }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff" }}>{t.time_saved_hours.toFixed(1)}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", fontWeight: 600, textTransform: "uppercase" }}>
                  Hours Saved
                </div>
              </div>
            </div>
          </div>

          {/* Common theme keywords */}
          {t.common_grievance_theme && (
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Common Theme:</span>
              {t.common_grievance_theme.split(",").map((kw) => (
                <span key={kw.trim()} style={{
                  background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                  color: "#C4B5FD", padding: "0.15rem 0.5rem", borderRadius: "4px",
                  fontSize: "0.72rem", fontFamily: "var(--font-mono)",
                }}>
                  {kw.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Resolve Section (only if Open/In Progress) */}
        {(t.status === "Open" || t.status === "In Progress") && (
          <div className="glass-panel" style={{
            borderLeft: "4px solid #10B981", marginBottom: "1.5rem",
          }}>
            <div className="panel-header">
              <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Check size={18} color="#10B981" />
                <span>Resolve All {t.child_count} Complaints at Once</span>
              </div>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              Enter resolution remarks below. These will be applied to <strong>all {t.child_count} linked complaints</strong> simultaneously.
              Each child case will transition to <strong>Resolved</strong> status with an audit trail recording the master ticket resolution.
            </div>
            <textarea
              value={resolveRemarks}
              onChange={(e) => setResolveRemarks(e.target.value)}
              placeholder="Enter resolution details (e.g. 'After investigation, the unapproved fee has been reversed by the institution. Refund process initiated for all affected students.')"
              rows={3}
              style={{
                width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: "8px", padding: "0.75rem", color: "#fff", fontSize: "0.85rem",
                resize: "vertical", fontFamily: "inherit", marginBottom: "0.75rem",
              }}
            />
            <button
              onClick={handleResolve}
              disabled={resolving || !resolveRemarks.trim()}
              style={{
                background: resolving
                  ? "rgba(16,185,129,0.3)"
                  : resolveRemarks.trim()
                    ? "linear-gradient(135deg, #059669, #10B981)"
                    : "rgba(16,185,129,0.15)",
                color: "#fff", border: "none", padding: "0.7rem 1.5rem",
                borderRadius: "8px", fontSize: "0.9rem", fontWeight: 700,
                cursor: resolving || !resolveRemarks.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "0.5rem",
                transition: "all 0.2s ease",
              }}
            >
              {resolving ? (
                <><RefreshCw size={16} className="spin" /> Resolving {t.child_count} complaints...</>
              ) : (
                <><CheckCircle size={16} /> Resolve All {t.child_count} Complaints</>
              )}
            </button>
          </div>
        )}

        {/* Resolution confirmation */}
        {t.status === "Resolved" && t.resolution_remarks && (
          <div style={{
            background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <CheckCircle size={16} color="#10B981" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10B981" }}>
                Resolved on {t.resolved_at ? formatDate(t.resolved_at) : "—"}
              </span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {t.resolution_remarks}
            </div>
          </div>
        )}

        {/* Child Cases Table */}
        <div className="glass-panel" style={{ borderLeft: "4px solid #3B82F6" }}>
          <div className="panel-header">
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Link2 size={18} color="#3B82F6" />
              <span>Linked Complaints ({t.children.length})</span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "0.7rem 1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: 700 }}>Case Ref</th>
                  <th style={{ padding: "0.7rem 1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: 700 }}>Subject</th>
                  <th style={{ padding: "0.7rem 1rem", textAlign: "center", color: "var(--text-muted)", fontWeight: 700 }}>Similarity</th>
                  <th style={{ padding: "0.7rem 1rem", textAlign: "center", color: "var(--text-muted)", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "0.7rem 1rem", textAlign: "center", color: "var(--text-muted)", fontWeight: 700 }}>Anchor</th>
                  <th style={{ padding: "0.7rem 1rem", textAlign: "right", color: "var(--text-muted)", fontWeight: 700 }}></th>
                </tr>
              </thead>
              <tbody>
                {t.children.map((child) => (
                  <tr
                    key={child.id}
                    style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "0.7rem 1rem" }}>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "0.78rem",
                        color: "#60A5FA", fontWeight: 600,
                      }}>
                        {child.case_reference_id}
                      </span>
                    </td>
                    <td style={{ padding: "0.7rem 1rem", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {child.subject}
                    </td>
                    <td style={{ padding: "0.7rem 1rem", textAlign: "center" }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.3rem",
                      }}>
                        <div style={{
                          width: "40px", height: "5px", borderRadius: "3px",
                          background: "rgba(255,255,255,0.1)", overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${child.similarity_score * 100}%`, height: "100%",
                            background: child.similarity_score >= 0.9 ? "#10B981" :
                              child.similarity_score >= 0.78 ? "#3B82F6" : "#F59E0B",
                            borderRadius: "3px",
                          }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                          {(child.similarity_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "0.7rem 1rem", textAlign: "center" }}>
                      <span style={{
                        background: child.status === "Resolved" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)",
                        color: child.status === "Resolved" ? "#10B981" : "#60A5FA",
                        padding: "0.15rem 0.5rem", borderRadius: "4px",
                        fontSize: "0.72rem", fontWeight: 700,
                      }}>
                        {child.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.7rem 1rem", textAlign: "center" }}>
                      {child.is_anchor && (
                        <span style={{
                          background: "rgba(245,158,11,0.12)", color: "#FBBF24",
                          padding: "0.15rem 0.4rem", borderRadius: "4px",
                          fontSize: "0.68rem", fontWeight: 700,
                        }}>
                          ANCHOR
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "0.7rem 1rem", textAlign: "right" }}>
                      {onSelectCase && (
                        <button
                          onClick={() => onSelectCase(child.case_reference_id)}
                          style={{
                            background: "none", border: "1px solid var(--border-subtle)",
                            color: "var(--text-secondary)", cursor: "pointer",
                            padding: "0.25rem 0.5rem", borderRadius: "4px",
                            fontSize: "0.72rem", fontWeight: 600,
                            display: "flex", alignItems: "center", gap: "0.3rem",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6";
                            (e.currentTarget as HTMLElement).style.color = "#60A5FA";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                          }}
                        >
                          <ExternalLink size={11} /> View
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
      {renderSuccessToast()}

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
            Smart Duplicate Grouping
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            AI-powered clustering that groups related complaints into Master Tickets. Resolve once, update all.
          </p>
        </div>
        {viewMode !== "overview" && viewMode !== "detail" && (
          <button
            onClick={() => { setViewMode("overview"); setDetectedGroups(null); }}
            style={{
              background: "none", border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)", padding: "0.5rem 1rem",
              borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
            }}
          >
            <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Overview
          </button>
        )}
      </div>

      {viewMode === "detail" ? (
        renderDetailView()
      ) : (
        <>
          {renderStatsCards()}
          {renderDetectionPanel()}
          {viewMode === "detect" && renderDetectedGroups()}
          {renderTicketList()}
        </>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};
