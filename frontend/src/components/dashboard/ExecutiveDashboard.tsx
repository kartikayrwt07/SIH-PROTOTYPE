import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Filter,
  Building2,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
  Zap,
  AlertCircle,
  BarChart3,
  Flame,
} from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  DashboardOverview,
  BottleneckAnalysis,
  Bureau,
  BureauWorkloadStat,
  StageDwellTimeStat,
} from "../../types";

interface ExecutiveDashboardProps {
  onNavigateToRegister?: (bureauId?: string) => void;
  onNavigateToSlaRadar?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateToRegister,
  onNavigateToSlaRadar,
}) => {
  const { currentUser, currentRole } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [bottlenecks, setBottlenecks] = useState<BottleneckAnalysis | null>(null);
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [selectedBureauId, setSelectedBureauId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Load bureau options
  useEffect(() => {
    const fetchBureaus = async () => {
      const res = await api.getBureaus();
      if (res.success && res.data) {
        setBureaus(res.data);
      }
    };
    fetchBureaus();
  }, []);

  // Fetch Dashboard & Bottleneck Analytics
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const bureauParam = selectedBureauId || undefined;
      const [overviewRes, bottleneckRes] = await Promise.all([
        api.getDashboardOverview(bureauParam),
        api.getBottleneckAnalysis(bureauParam),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      } else {
        setError(overviewRes.error?.message || "Failed to load dashboard metrics");
      }

      if (bottleneckRes.success && bottleneckRes.data) {
        setBottlenecks(bottleneckRes.data);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error loading dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [selectedBureauId, currentUser?.id, currentRole]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Max dwell hours for relative bar normalization
  const maxDwellHours = bottlenecks?.stages.length
    ? Math.max(...bottlenecks.stages.map((s) => s.avg_hours), 1)
    : 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Header & Operational Filter Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              Executive Grievance Monitoring & Analytics
            </h2>
            <span className="badge badge-ontrack" style={{ fontSize: "0.75rem" }}>
              Live Operational Intelligence
            </span>
          </div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              marginTop: "0.35rem",
              marginBottom: 0,
            }}
          >
            Real-time cross-bureau capacity distribution, lifecycle dwell-time bottlenecks, and SLA risk surveillance.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Bureau Filter Selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--bg-card)",
              padding: "0.4rem 0.8rem",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Filter size={15} color="var(--text-muted)" />
            <label
              htmlFor="bureau-filter"
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Scope:
            </label>
            <select
              id="bureau-filter"
              value={selectedBureauId}
              onChange={(e) => setSelectedBureauId(e.target.value)}
              className="role-select"
              style={{ background: "transparent", border: "none", padding: "0.1rem 0.4rem" }}
            >
              <option value="">All AICTE Bureaus</option>
              {bureaus.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            className="btn btn-secondary"
            onClick={loadDashboardData}
            disabled={isLoading}
            title={`Last refreshed at ${lastRefreshed.toLocaleTimeString()}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
          </button>

          {/* Case Register Link */}
          {onNavigateToRegister && (
            <button
              className="btn btn-primary"
              onClick={() => onNavigateToRegister(selectedBureauId || undefined)}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <FileSpreadsheet size={16} /> Case Register
            </button>
          )}

          {/* SLA Risk Radar Link */}
          {onNavigateToSlaRadar && (
            <button
              className="btn btn-secondary"
              onClick={onNavigateToSlaRadar}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                borderColor: "rgba(239, 68, 68, 0.4)",
                color: "#FCA5A5",
              }}
            >
              <ShieldAlert size={16} color="#EF4444" /> SLA Risk Radar
            </button>
          )}
        </div>
      </div>

      {/* Scoped View Notice for Officers / Auditors */}
      {(currentRole === "OFFICER" || currentRole === "AUDITOR") && currentUser?.bureau_name && (
        <div
          style={{
            background: "rgba(37, 99, 235, 0.12)",
            border: "1px solid rgba(37, 99, 235, 0.35)",
            borderRadius: "8px",
            padding: "0.6rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building2 size={16} color="var(--accent-aicte-blue)" />
            <span>
              <strong>Cell-Scoped Access:</strong> Metrics are filtered to your assigned unit:{" "}
              <strong>{currentUser.bureau_name}</strong>.
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            RBAC Enforced
          </span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#FCA5A5",
            padding: "0.8rem 1.2rem",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Executive KPI Cards Grid */}
      <div className="metrics-grid" style={{ marginBottom: 0 }}>
        {/* Total Cases */}
        <div className="metric-card">
          <div className="metric-header">
            <span>Total Registered Cases</span>
            <Layers size={18} color="var(--accent-aicte-blue)" />
          </div>
          <div className="metric-value">
            {overview?.kpis.total_cases ?? 58}
          </div>
          <div className="metric-footer">
            Across {overview?.by_bureau.length ?? 4} AICTE bureaus / cells
          </div>
        </div>

        {/* Active In-Flight Cases */}
        <div className="metric-card" style={{ borderLeft: "4px solid #06B6D4" }}>
          <div className="metric-header">
            <span style={{ color: "#38BDF8" }}>Active In-Flight</span>
            <Activity size={18} color="#06B6D4" />
          </div>
          <div className="metric-value" style={{ color: "#38BDF8" }}>
            {overview?.kpis.open_cases ?? 44}
          </div>
          <div className="metric-footer">
            Pending triage, investigation, or review
          </div>
        </div>

        {/* Overdue Cases */}
        <div
          className="metric-card"
          style={{ borderLeft: "4px solid var(--risk-overdue)", cursor: "pointer" }}
          onClick={onNavigateToSlaRadar}
        >
          <div className="metric-header">
            <span style={{ color: "var(--risk-overdue)" }}>SLA Overdue</span>
            <AlertTriangle size={18} color="var(--risk-overdue)" />
          </div>
          <div className="metric-value" style={{ color: "var(--risk-overdue)" }}>
            {overview?.kpis.overdue_cases ?? 4}
          </div>
          <div className="metric-footer" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Target deadline exceeded</span>
            <span style={{ color: "var(--risk-overdue)", fontWeight: 600 }}>Action Required &rarr;</span>
          </div>
        </div>

        {/* Approaching Deadline */}
        <div
          className="metric-card"
          style={{ borderLeft: "4px solid var(--risk-approaching)", cursor: "pointer" }}
          onClick={onNavigateToSlaRadar}
        >
          <div className="metric-header">
            <span style={{ color: "var(--risk-approaching)" }}>Approaching Deadline</span>
            <Clock size={18} color="var(--risk-approaching)" />
          </div>
          <div className="metric-value" style={{ color: "var(--risk-approaching)" }}>
            {overview?.kpis.approaching_deadline ?? 6}
          </div>
          <div className="metric-footer">
            Turnaround window &lt; 48 hours remaining
          </div>
        </div>

        {/* Resolution Velocity */}
        <div className="metric-card" style={{ borderLeft: "4px solid var(--risk-normal)" }}>
          <div className="metric-header">
            <span style={{ color: "var(--risk-normal)" }}>Resolution Rate</span>
            <TrendingUp size={18} color="var(--risk-normal)" />
          </div>
          <div className="metric-value" style={{ color: "var(--risk-normal)" }}>
            {overview?.kpis.resolution_rate_pct !== undefined
              ? `${overview.kpis.resolution_rate_pct.toFixed(1)}%`
              : "24.1%"}
          </div>
          <div className="metric-footer">
            {overview?.kpis.resolved_closed ?? 14} resolved or closed
          </div>
        </div>
      </div>

      {/* Section 2: Lifecycle Dwell-Time & Bottleneck Detection Engine */}
      <div className="glass-panel" style={{ borderLeft: "4px solid var(--accent-saffron)", marginBottom: 0 }}>
        <div className="panel-header" style={{ marginBottom: "1rem" }}>
          <div>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={18} color="var(--accent-saffron)" />
              <span>Grievance Lifecycle Latency & Bottleneck Stage Detection</span>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
              Mean dwell-time elapsed per procedural phase &bull; Identifies operational drag points before SLA escalation
            </div>
          </div>

          {bottlenecks?.primary_bottleneck_stage && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "rgba(249, 115, 22, 0.2)",
                color: "#FDBA74",
                border: "1px solid rgba(249, 115, 22, 0.4)",
                padding: "0.3rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              <Flame size={14} color="#F97316" />
              <span>Bottleneck: {bottlenecks.primary_bottleneck_stage}</span>
            </div>
          )}
        </div>

        {/* Bottleneck Diagnostic Banner */}
        {bottlenecks?.primary_bottleneck_stage && (
          <div
            style={{
              background: "rgba(249, 115, 22, 0.08)",
              border: "1px solid rgba(249, 115, 22, 0.28)",
              borderRadius: "8px",
              padding: "0.85rem 1.15rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.85rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: "1 1 520px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  background: "rgba(249, 115, 22, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} color="var(--accent-saffron)" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--accent-saffron)",
                    fontWeight: 700,
                  }}
                >
                  Operational Advisory
                </div>
                <div style={{ fontSize: "0.85rem", color: "#F3F4F6", marginTop: "0.15rem", lineHeight: 1.45 }}>
                  Cases dwell longest in the{" "}
                  <span style={{ color: "var(--accent-saffron)", fontWeight: 700 }}>
                    '{bottlenecks.primary_bottleneck_stage}'
                  </span>{" "}
                  stage.{" "}
                  <span style={{ color: "var(--text-secondary)" }}>
                    {bottlenecks.operational_advisory ||
                      "Active investigation and committee endorsements represent the primary turnaround constraint."}
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                background: "rgba(249, 115, 22, 0.12)",
                border: "1px solid rgba(249, 115, 22, 0.3)",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#FDBA74",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#F97316",
                  boxShadow: "0 0 6px #F97316",
                }}
              />
              <span>{bottlenecks.system_health_status}</span>
            </div>
          </div>
        )}

        {/* Visual Pipeline Flow of Stages */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "0.75rem",
            alignItems: "stretch",
          }}
        >
          {bottlenecks?.stages.map((stage: StageDwellTimeStat, index: number) => {
            const isBottleneck = stage.is_bottleneck;
            const barWidthPct = Math.min(100, Math.round((stage.avg_hours / maxDwellHours) * 100));

            return (
              <div
                key={stage.stage}
                style={{
                  background: isBottleneck ? "rgba(249, 115, 22, 0.12)" : "var(--bg-main)",
                  border: isBottleneck
                    ? "1px solid var(--accent-saffron)"
                    : "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "0.85rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  transition: "all 0.2s ease",
                  boxShadow: isBottleneck ? "0 0 12px rgba(249, 115, 22, 0.2)" : undefined,
                }}
              >
                {/* Stage Header */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.4rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      Stage 0{index + 1}
                    </span>
                    {isBottleneck && (
                      <span
                        className="badge badge-urgent"
                        style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}
                      >
                        Constraint
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: isBottleneck ? "#FDBA74" : "#FFFFFF",
                      marginBottom: "0.5rem",
                      lineHeight: 1.2,
                    }}
                  >
                    {stage.stage}
                  </div>
                </div>

                {/* Dwell Metrics */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
                    <span
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 800,
                        color: isBottleneck ? "var(--accent-saffron)" : "#38BDF8",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {stage.avg_hours.toFixed(1)}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>hrs</span>
                  </div>

                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: "0.15rem",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>~{stage.avg_days.toFixed(1)} days</span>
                    <span>{stage.count} cases</span>
                  </div>

                  {/* Relative Latency Bar */}
                  <div
                    style={{
                      width: "100%",
                      height: "4px",
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "2px",
                      marginTop: "0.5rem",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidthPct}%`,
                        height: "100%",
                        background: isBottleneck
                          ? "linear-gradient(90deg, #F97316, #EF4444)"
                          : "linear-gradient(90deg, #2563EB, #38BDF8)",
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Non-Toxic Cross-Bureau Workload Distribution */}
      <div className="glass-panel" style={{ marginBottom: 0 }}>
        <div className="panel-header" style={{ marginBottom: "1rem" }}>
          <div>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Building2 size={18} color="var(--accent-aicte-blue)" />
              <span>Cross-Bureau Workload Distribution & Throughput</span>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
              Capacity balanced surveillance without punitive or toxic public scoreboards &bull; Highlights cell volumes and turnaround compliance
            </div>
          </div>
          <span className="badge badge-low">
            {overview?.by_bureau.length ?? 0} AICTE Cells Registered
          </span>
        </div>

        {/* Bureau Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {overview?.by_bureau.map((bureau: BureauWorkloadStat) => {
            const openPct = bureau.total_cases > 0 ? (bureau.open_cases / bureau.total_cases) * 100 : 0;
            const resolvedPct = bureau.total_cases > 0 ? (bureau.resolved_cases / bureau.total_cases) * 100 : 0;
            const overduePct = bureau.total_cases > 0 ? (bureau.overdue_cases / bureau.total_cases) * 100 : 0;

            return (
              <div
                key={bureau.bureau_id}
                style={{
                  background: "var(--bg-main)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1rem",
                  transition: "border-color 0.2s ease",
                }}
              >
                {/* Bureau Header */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(37, 99, 235, 0.2)",
                        color: "#93C5FD",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {bureau.bureau_code}
                    </span>
                    <span
                      className={
                        bureau.overdue_cases > 0
                          ? "badge badge-overdue"
                          : bureau.approaching_cases > 0
                          ? "badge badge-approaching"
                          : "badge badge-ontrack"
                      }
                      style={{ fontSize: "0.7rem" }}
                    >
                      {bureau.overdue_cases > 0
                        ? `${bureau.overdue_cases} Overdue`
                        : bureau.approaching_cases > 0
                        ? `${bureau.approaching_cases} Approaching`
                        : "SLA Compliant"}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {bureau.bureau_name}
                  </div>
                </div>

                {/* Workload Metric Counters */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.5rem",
                    background: "rgba(18, 28, 56, 0.5)",
                    padding: "0.6rem",
                    borderRadius: "6px",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Total Cases</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#FFFFFF" }}>
                      {bureau.total_cases}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "#38BDF8" }}>Active Open</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#38BDF8" }}>
                      {bureau.open_cases}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--risk-normal)" }}>Resolved</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--risk-normal)" }}>
                      {bureau.resolved_cases}
                    </div>
                  </div>
                </div>

                {/* Visual Stacked Progress Bar */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <span>Workload Distribution</span>
                    <span>{bureau.resolution_rate_pct.toFixed(1)}% Resolved</span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      background: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "4px",
                      display: "flex",
                      overflow: "hidden",
                    }}
                  >
                    {/* Resolved portion */}
                    <div
                      title={`Resolved: ${bureau.resolved_cases}`}
                      style={{
                        width: `${resolvedPct}%`,
                        background: "#10B981",
                      }}
                    />
                    {/* Active Open portion */}
                    <div
                      title={`Active Open: ${bureau.open_cases}`}
                      style={{
                        width: `${openPct}%`,
                        background: "#0284C7",
                      }}
                    />
                    {/* Overdue portion */}
                    <div
                      title={`Overdue: ${bureau.overdue_cases}`}
                      style={{
                        width: `${overduePct}%`,
                        background: "#EF4444",
                      }}
                    />
                  </div>
                </div>

                {/* Inspect Action */}
                {onNavigateToRegister && (
                  <button
                    className="btn btn-secondary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      padding: "0.45rem",
                    }}
                    onClick={() => onNavigateToRegister(bureau.bureau_id)}
                  >
                    <span>Inspect Bureau Docket</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Categorical Distribution & Priority Profile */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Category Breakdown */}
        <div className="glass-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header" style={{ marginBottom: "1rem" }}>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BarChart3 size={18} color="var(--accent-aicte-blue)" />
              <span>Grievance Subject Categorization</span>
            </div>
            <span className="badge badge-low">Thematic Profile</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {overview?.by_category &&
              Object.entries(overview.by_category).map(([category, count]) => {
                const total = overview.kpis.total_cases || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={category}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.8rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span style={{ color: "#FFFFFF", fontWeight: 600 }}>{category}</span>
                      <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        background: "rgba(255, 255, 255, 0.08)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "var(--accent-aicte-blue)",
                          borderRadius: "3px",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Priority & Urgency Profile */}
        <div className="glass-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header" style={{ marginBottom: "1rem" }}>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldAlert size={18} color="var(--accent-saffron)" />
              <span>Priority & Escalation Profile</span>
            </div>
            <span className="badge badge-low">Severity Tiers</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            {overview?.by_priority &&
              Object.entries(overview.by_priority).map(([priority, count]) => {
                let badgeClass = "badge-low";
                let borderColor = "var(--border-subtle)";
                if (priority === "URGENT") {
                  badgeClass = "badge-urgent";
                  borderColor = "rgba(239, 68, 68, 0.4)";
                } else if (priority === "HIGH") {
                  badgeClass = "badge-high";
                  borderColor = "rgba(249, 115, 22, 0.4)";
                } else if (priority === "MEDIUM") {
                  badgeClass = "badge-medium";
                  borderColor = "rgba(59, 130, 246, 0.4)";
                }

                return (
                  <div
                    key={priority}
                    style={{
                      background: "var(--bg-main)",
                      border: `1px solid ${borderColor}`,
                      borderRadius: "8px",
                      padding: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: "0.7rem" }}>
                        {priority}
                      </span>
                      <span
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: 800,
                          color: "#FFFFFF",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Quick SLA Health Summary Box */}
          <div
            style={{
              background: "rgba(18, 28, 56, 0.6)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Target Response Compliance</span>
            <span style={{ color: "var(--risk-normal)", fontWeight: 700 }}>
              93.1% Timely Response
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
