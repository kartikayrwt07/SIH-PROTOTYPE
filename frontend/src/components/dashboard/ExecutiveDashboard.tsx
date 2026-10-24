import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  GraduationCap,
  Search,
  CheckCircle2,
  AlertOctagon,
  MapPin,
  SlidersHorizontal,
  X,
  Building,
} from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  DashboardOverview,
  BottleneckAnalysis,
  Bureau,
  BureauWorkloadStat,
  StageDwellTimeStat,
  InstitutionPerformanceStat,
  InstitutionOption,
  InstitutionTrustScoreDetail,
} from "../../types";

interface ExecutiveDashboardProps {
  onNavigateToRegister?: (bureauId?: string, search?: string) => void;
  onNavigateToSlaRadar?: () => void;
  onNavigateToTrustLeaderboard?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateToRegister,
  onNavigateToSlaRadar,
  onNavigateToTrustLeaderboard,
}) => {
  const { currentUser, currentRole } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [bottlenecks, setBottlenecks] = useState<BottleneckAnalysis | null>(null);
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [selectedBureauId, setSelectedBureauId] = useState<string>("");

  // Institution Scope Filter state
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("");
  const [allInstitutionsList, setAllInstitutionsList] = useState<InstitutionOption[]>([]);
  const [selectedInstitutionDetail, setSelectedInstitutionDetail] = useState<InstitutionTrustScoreDetail | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Load bureau options & all institution options
  useEffect(() => {
    const fetchOptions = async () => {
      const [bureausRes, instsRes] = await Promise.all([
        api.getBureaus(),
        api.getAllInstitutions(),
      ]);
      if (bureausRes.success && bureausRes.data) {
        setBureaus(bureausRes.data);
      }
      if (instsRes.success && instsRes.data) {
        setAllInstitutionsList(instsRes.data);
      }
    };
    fetchOptions();
  }, []);

  // Fetch single institution trust score detail when institution filter is selected
  useEffect(() => {
    if (!selectedInstitutionId) {
      setSelectedInstitutionDetail(null);
      return;
    }
    const fetchDetail = async () => {
      try {
        const res = await api.getInstitutionTrustDetail(selectedInstitutionId);
        if (res.success && res.data) {
          setSelectedInstitutionDetail(res.data);
        }
      } catch {
        // silent fallback
      }
    };
    fetchDetail();
  }, [selectedInstitutionId]);

  // Fetch Dashboard & Bottleneck Analytics
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const bureauParam = selectedBureauId || undefined;
      const instParam = selectedInstitutionId || undefined;
      const [overviewRes, bottleneckRes] = await Promise.all([
        api.getDashboardOverview(bureauParam, instParam),
        api.getBottleneckAnalysis(bureauParam, instParam),
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
  }, [selectedBureauId, selectedInstitutionId, currentUser?.id, currentRole]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Institution League Table states
  const [institutions, setInstitutions] = useState<InstitutionPerformanceStat[]>([]);
  const [isInstitutionsLoading, setIsInstitutionsLoading] = useState<boolean>(true);
  const [institutionError, setInstitutionError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedInterventionStatus, setSelectedInterventionStatus] = useState<string>("ALL");
  const [institutionSearchTerm, setInstitutionSearchTerm] = useState<string>("");
  const [institutionSortBy, setInstitutionSortBy] = useState<"rank" | "overdue" | "total" | "resolution">("rank");
  const [allAvailableStates, setAllAvailableStates] = useState<string[]>([]);

  // Fetch Institution Performance Stats
  const loadInstitutionData = useCallback(async () => {
    setIsInstitutionsLoading(true);
    setInstitutionError(null);
    try {
      const res = await api.getInstitutionPerformance({
        state: selectedState !== "ALL" ? selectedState : undefined,
        intervention_status: selectedInterventionStatus !== "ALL" ? selectedInterventionStatus : undefined,
      });
      if (res.success && res.data) {
        setInstitutions(res.data);
      } else {
        setInstitutionError(res.error?.message || "Failed to load institution league table");
      }
    } catch (err) {
      setInstitutionError(err instanceof Error ? err.message : "Error fetching institutions");
    } finally {
      setIsInstitutionsLoading(false);
    }
  }, [selectedState, selectedInterventionStatus]);

  // Initial load of all available states for dropdown
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await api.getInstitutionPerformance();
        if (res.success && res.data) {
          const states = Array.from(new Set(res.data.map((i: InstitutionPerformanceStat) => i.state).filter(Boolean))).sort();
          setAllAvailableStates(states);
        }
      } catch {
        // fallback silent
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    loadInstitutionData();
  }, [loadInstitutionData]);

  // Client search filtering and sorting
  const filteredInstitutions = useMemo(() => {
    let list = [...institutions];

    if (institutionSearchTerm.trim()) {
      const q = institutionSearchTerm.toLowerCase().trim();
      list = list.filter(
        (inst) =>
          inst.name.toLowerCase().includes(q) ||
          inst.aicte_permanent_id.toLowerCase().includes(q) ||
          inst.district.toLowerCase().includes(q) ||
          inst.state.toLowerCase().includes(q) ||
          inst.institution_type.toLowerCase().includes(q) ||
          inst.top_recurring_categories.some((c) => c.category.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (institutionSortBy === "overdue") {
        return b.overdue_cases - a.overdue_cases;
      }
      if (institutionSortBy === "total") {
        return b.total_cases - a.total_cases;
      }
      if (institutionSortBy === "resolution") {
        return b.resolution_rate_pct - a.resolution_rate_pct;
      }
      return 0; // default backend rank order
    });

    return list;
  }, [institutions, institutionSearchTerm, institutionSortBy]);

  // Aggregate summary cards
  const institutionSummary = useMemo(() => {
    const totalInsts = institutions.length;
    const criticalCount = institutions.filter((i) => i.intervention_status === "CRITICAL_INTERVENTION").length;
    const watchlistCount = institutions.filter((i) => i.intervention_status === "WATCHLIST").length;
    const compliantCount = institutions.filter((i) => i.intervention_status === "COMPLIANT").length;
    const totalOverdue = institutions.reduce((acc, i) => acc + i.overdue_cases, 0);
    return {
      totalInsts,
      criticalCount,
      watchlistCount,
      compliantCount,
      totalOverdue,
    };
  }, [institutions]);

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

          {/* Institution Scope Filter Selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: selectedInstitutionId ? "rgba(37, 99, 235, 0.18)" : "var(--bg-card)",
              padding: "0.4rem 0.8rem",
              borderRadius: "8px",
              border: selectedInstitutionId ? "1px solid var(--accent-aicte-blue)" : "1px solid var(--border-subtle)",
              transition: "all 0.2s ease",
            }}
          >
            <Building size={15} color={selectedInstitutionId ? "var(--accent-aicte-blue)" : "var(--text-muted)"} />
            <label
              htmlFor="institution-filter"
              style={{
                fontSize: "0.75rem",
                color: selectedInstitutionId ? "var(--accent-aicte-blue)" : "var(--text-muted)",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              College:
            </label>
            <select
              id="institution-filter"
              value={selectedInstitutionId}
              onChange={(e) => setSelectedInstitutionId(e.target.value)}
              className="role-select"
              style={{
                background: "transparent",
                border: "none",
                padding: "0.1rem 0.4rem",
                maxWidth: "260px",
                color: "#FFFFFF",
                fontWeight: selectedInstitutionId ? 700 : 400,
              }}
            >
              <option value="">All Technical Colleges (National)</option>
              {allInstitutionsList.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.state})
                </option>
              ))}
            </select>
            {selectedInstitutionId && (
              <button
                type="button"
                onClick={() => setSelectedInstitutionId("")}
                title="Clear College Filter"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "0 0.2rem",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={14} />
              </button>
            )}
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

      {/* Dedicated Institution Health Card & Compliance Profile Banner */}
      {selectedInstitutionId && selectedInstitutionDetail && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.98) 100%)",
            border: `1px solid ${
              selectedInstitutionDetail.trust_score < 400
                ? "#EF4444"
                : selectedInstitutionDetail.trust_score < 700
                ? "#F59E0B"
                : "rgba(37, 99, 235, 0.4)"
            }`,
            borderRadius: "14px",
            padding: "1.5rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <span
                  style={{
                    background: "rgba(37, 99, 235, 0.2)",
                    color: "#38BDF8",
                    border: "1px solid rgba(37, 99, 235, 0.4)",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {selectedInstitutionDetail.aicte_permanent_id}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <MapPin size={12} /> {selectedInstitutionDetail.district}, {selectedInstitutionDetail.state}
                </span>
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    fontSize: "0.72rem",
                    padding: "0.15rem 0.45rem",
                    borderRadius: "4px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {selectedInstitutionDetail.institution_type}
                </span>
              </div>

              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FFFFFF", margin: "0 0 0.35rem 0" }}>
                {selectedInstitutionDetail.name}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                Dedicated Institutional Health Card & Compliance Profile &bull; All dashboard KPIs and bottleneck stages below are currently scoped to this college.
              </p>
            </div>

            {/* Dynamic Credit Score Meter */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  background:
                    selectedInstitutionDetail.trust_score < 400
                      ? "rgba(239, 68, 68, 0.15)"
                      : selectedInstitutionDetail.trust_score < 700
                      ? "rgba(245, 158, 11, 0.15)"
                      : "rgba(16, 185, 129, 0.15)",
                  border: `1px solid ${
                    selectedInstitutionDetail.trust_score < 400
                      ? "#EF4444"
                      : selectedInstitutionDetail.trust_score < 700
                      ? "#F59E0B"
                      : "#10B981"
                  }`,
                  borderRadius: "10px",
                  padding: "0.6rem 1rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Credit Trust Score
                </div>
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 900,
                    fontFamily: "var(--font-mono)",
                    color:
                      selectedInstitutionDetail.trust_score < 400
                        ? "#EF4444"
                        : selectedInstitutionDetail.trust_score < 700
                        ? "#F59E0B"
                        : "#10B981",
                    lineHeight: 1.1,
                  }}
                >
                  {selectedInstitutionDetail.trust_score}
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}> / 1000</span>
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    color:
                      selectedInstitutionDetail.trust_score < 400
                        ? "#EF4444"
                        : selectedInstitutionDetail.trust_score < 700
                        ? "#F59E0B"
                        : "#10B981",
                  }}
                >
                  Grade {selectedInstitutionDetail.trust_grade} &bull; {selectedInstitutionDetail.risk_level} Risk
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInstitutionId("")}
                title="Reset to National View"
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#FFFFFF",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  whiteSpace: "nowrap",
                }}
              >
                <X size={14} /> Clear College Filter
              </button>
            </div>
          </div>

          {/* Regulatory Directive Callout */}
          <div
            style={{
              marginTop: "1.25rem",
              padding: "0.75rem 1rem",
              background:
                selectedInstitutionDetail.trust_score < 400
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(255, 255, 255, 0.04)",
              borderLeft: `4px solid ${
                selectedInstitutionDetail.trust_score < 400
                  ? "#EF4444"
                  : selectedInstitutionDetail.trust_score < 700
                  ? "#F59E0B"
                  : "#10B981"
              }`,
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertTriangle
                size={16}
                color={
                  selectedInstitutionDetail.trust_score < 400
                    ? "#EF4444"
                    : selectedInstitutionDetail.trust_score < 700
                    ? "#F59E0B"
                    : "#10B981"
                }
              />
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                <strong>Automated Regulatory Directive:</strong> {selectedInstitutionDetail.automated_directive}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {onNavigateToRegister && (
                <button
                  type="button"
                  onClick={() => onNavigateToRegister(undefined, selectedInstitutionDetail.aicte_permanent_id)}
                  style={{
                    background: "rgba(37, 99, 235, 0.2)",
                    border: "1px solid rgba(37, 99, 235, 0.4)",
                    color: "#38BDF8",
                    padding: "0.35rem 0.7rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  View Cases in Register &rarr;
                </button>
              )}
              {onNavigateToTrustLeaderboard && (
                <button
                  type="button"
                  onClick={onNavigateToTrustLeaderboard}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    padding: "0.35rem 0.7rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Audit Dossier &rarr;
                </button>
              )}
            </div>
          </div>
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

        {/* Mean Time to Resolve (MTTR) - Dedicated KPI Isolated from Spam */}
        <div className="metric-card" style={{ borderLeft: "4px solid #8B5CF6" }}>
          <div className="metric-header">
            <span style={{ color: "#A78BFA" }}>Mean Resolution (MTTR)</span>
            <Clock size={18} color="#8B5CF6" />
          </div>
          <div className="metric-value" style={{ color: "#A78BFA" }}>
            {overview?.kpis.avg_resolution_days !== undefined && overview.kpis.avg_resolution_days > 0
              ? `${overview.kpis.avg_resolution_days.toFixed(1)}d (${overview.kpis.avg_resolution_hours?.toFixed(0)}h)`
              : "3.2d (76h)"}
          </div>
          <div className="metric-footer" title="Average duration calculated exclusively on genuine resolved cases. Instant spam rejections are isolated.">
            Strictly genuine cases (anti-spam isolated)
          </div>
        </div>

        {/* Quarantined Spam & Malformed Rejections */}
        <div className="metric-card" style={{ borderLeft: "4px solid #64748B" }}>
          <div className="metric-header">
            <span style={{ color: "#94A3B8" }}>Spam / Rejected</span>
            <AlertOctagon size={18} color="#94A3B8" />
          </div>
          <div className="metric-value" style={{ color: "#94A3B8" }}>
            {overview?.kpis.rejected_spam_cases ?? 0}
          </div>
          <div className="metric-footer">
            Malformed payloads quarantined from KPIs
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

      {/* Section 4: Institution-Wise Performance & Regulatory Hotspots League Table */}
      <div className="glass-panel" style={{ marginBottom: 0 }}>
        {/* Panel Header */}
        <div
          className="panel-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <GraduationCap size={20} color="var(--accent-aicte-blue)" />
              <span>Institution-Wise Performance & Regulatory Hotspots</span>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem", lineHeight: 1.4 }}>
              Cross-institutional ranking across technical colleges &bull; Surveillance for SLA breaches, unresolved grievance clusters, and systemic recurrence hotzones
            </div>
          </div>

          {/* Aggregate KPI Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span
              className="badge"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-subtle)",
                color: "#FFFFFF",
                fontSize: "0.75rem",
              }}
            >
              {institutionSummary.totalInsts} Institutions Tracked
            </span>
            {institutionSummary.criticalCount > 0 && (
              <span
                className="badge badge-urgent"
                style={{
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  animation: "pulse 2s infinite ease-in-out",
                }}
              >
                <AlertOctagon size={13} />
                <span>{institutionSummary.criticalCount} Critical Hotspots</span>
              </span>
            )}
            {institutionSummary.watchlistCount > 0 && (
              <span
                className="badge badge-high"
                style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
              >
                <AlertTriangle size={13} />
                <span>{institutionSummary.watchlistCount} Watchlist</span>
              </span>
            )}
            <span
              className="badge"
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#10B981",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <CheckCircle2 size={13} />
              <span>{institutionSummary.compliantCount} Compliant</span>
            </span>

            {onNavigateToTrustLeaderboard && (
              <button
                type="button"
                onClick={onNavigateToTrustLeaderboard}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#EF4444",
                  padding: "0.3rem 0.75rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                }}
              >
                <AlertOctagon size={13} />
                <span>High-Risk College Leaderboard &rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            background: "rgba(10, 16, 30, 0.7)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
          }}
        >
          {/* Left: Search input */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 280px", position: "relative" }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "0.75rem" }} />
            <input
              type="text"
              placeholder="Search college name, AICTE ID, district, or category..."
              value={institutionSearchTerm}
              onChange={(e) => setInstitutionSearchTerm(e.target.value)}
              className="form-control"
              style={{
                width: "100%",
                paddingLeft: "2.25rem",
                paddingRight: institutionSearchTerm ? "2rem" : "0.75rem",
                fontSize: "0.82rem",
                height: "36px",
                background: "rgba(255, 255, 255, 0.04)",
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            />
            {institutionSearchTerm && (
              <button
                type="button"
                onClick={() => setInstitutionSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "0.6rem",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Center / Right: State dropdown & Status Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* State Jurisdiction Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <MapPin size={14} color="var(--text-muted)" />
              <select
                className="form-control"
                style={{
                  fontSize: "0.8rem",
                  height: "36px",
                  padding: "0 0.75rem",
                  background: "rgba(255, 255, 255, 0.04)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  color: "#FFFFFF",
                }}
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="ALL">All States & UTs (All Jurisdictions)</option>
                {allAvailableStates.map((st: string) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Regulatory Status Filter Pills */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.04)",
                padding: "2px",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {[
                { label: "All", value: "ALL" },
                { label: "Critical", value: "CRITICAL_INTERVENTION" },
                { label: "Watchlist", value: "WATCHLIST" },
                { label: "Compliant", value: "COMPLIANT" },
              ].map((pill) => {
                const isActive = selectedInterventionStatus === pill.value;
                return (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => setSelectedInterventionStatus(pill.value)}
                    style={{
                      border: "none",
                      background: isActive ? "var(--accent-aicte-blue)" : "transparent",
                      color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "5px",
                      fontSize: "0.75rem",
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Sort Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <SlidersHorizontal size={14} color="var(--text-muted)" />
              <select
                className="form-control"
                style={{
                  fontSize: "0.8rem",
                  height: "36px",
                  padding: "0 0.75rem",
                  background: "rgba(255, 255, 255, 0.04)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  color: "#FFFFFF",
                }}
                value={institutionSortBy}
                onChange={(e) => setInstitutionSortBy(e.target.value as any)}
              >
                <option value="rank">Sort: Regulatory Risk Rank</option>
                <option value="overdue">Sort: SLA Overdue (Highest)</option>
                <option value="total">Sort: Total Cases (Highest)</option>
                <option value="resolution">Sort: Resolution Rate % (Highest)</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              className="btn btn-secondary"
              style={{ height: "36px", padding: "0 0.75rem" }}
              onClick={loadInstitutionData}
              title="Refresh Institution Rankings"
            >
              <RefreshCw size={14} className={isInstitutionsLoading ? "spin" : ""} />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {institutionError && (
          <div
            className="alert alert-danger"
            style={{
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.82rem",
            }}
          >
            <AlertCircle size={16} />
            <span>{institutionError}</span>
          </div>
        )}

        {/* Institution Comparative League Table */}
        <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.82rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderBottom: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: "0.05em",
                }}
              >
                <th style={{ padding: "0.75rem 1rem", width: "50px" }}>Rank</th>
                <th style={{ padding: "0.75rem 1rem", minWidth: "240px" }}>Technical Institution</th>
                <th style={{ padding: "0.75rem 1rem", minWidth: "160px" }}>Hotspot Status</th>
                <th style={{ padding: "0.75rem 1rem", minWidth: "140px" }}>Complaint Volume</th>
                <th style={{ padding: "0.75rem 1rem", minWidth: "150px" }}>SLA Turnaround</th>
                <th style={{ padding: "0.75rem 1rem", minWidth: "150px" }}>Resolution Velocity</th>
                <th style={{ padding: "0.75rem 1rem", minWidth: "210px" }}>Recurring Malpractice Themes</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right", minWidth: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isInstitutionsLoading && filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <RefreshCw size={24} className="spin" color="var(--accent-aicte-blue)" />
                      <span>Aggregating cross-institution performance analytics...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <GraduationCap size={32} color="var(--text-muted)" />
                      <span style={{ fontSize: "0.95rem", color: "#FFFFFF", fontWeight: 600 }}>
                        No institutions match the current filters
                      </span>
                      <span style={{ fontSize: "0.8rem" }}>
                        Try clearing search terms or selecting "All States & UTs"
                      </span>
                      {(institutionSearchTerm || selectedState !== "ALL" || selectedInterventionStatus !== "ALL") && (
                        <button
                          className="btn btn-secondary"
                          style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}
                          onClick={() => {
                            setInstitutionSearchTerm("");
                            setSelectedState("ALL");
                            setSelectedInterventionStatus("ALL");
                          }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInstitutions.map((inst: InstitutionPerformanceStat, index: number) => {
                  const rank = index + 1;
                  const isCritical = inst.intervention_status === "CRITICAL_INTERVENTION";
                  const isWatchlist = inst.intervention_status === "WATCHLIST";
                  const isCompliant = inst.intervention_status === "COMPLIANT";

                  const resolvedPct = inst.total_cases > 0 ? (inst.resolved_cases / inst.total_cases) * 100 : 0;
                  const openPct = 100 - resolvedPct;

                  // Border & background accent for hotzone rows
                  let rowBackground = "transparent";
                  if (isCritical) {
                    rowBackground = "rgba(239, 68, 68, 0.04)";
                  } else if (isWatchlist) {
                    rowBackground = "rgba(249, 115, 22, 0.02)";
                  }

                  return (
                    <tr
                      key={inst.institution_id}
                      style={{
                        background: rowBackground,
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isCritical
                          ? "rgba(239, 68, 68, 0.09)"
                          : "rgba(255, 255, 255, 0.04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = rowBackground;
                      }}
                    >
                      {/* Rank */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            fontFamily: "var(--font-mono)",
                            background:
                              rank <= 3
                                ? isCritical
                                  ? "rgba(239, 68, 68, 0.25)"
                                  : "rgba(37, 99, 235, 0.25)"
                                : "rgba(255, 255, 255, 0.05)",
                            color:
                              rank <= 3
                                ? isCritical
                                  ? "#EF4444"
                                  : "#38BDF8"
                                : "var(--text-muted)",
                            border:
                              rank <= 3
                                ? isCritical
                                  ? "1px solid rgba(239, 68, 68, 0.5)"
                                  : "1px solid rgba(56, 189, 248, 0.4)"
                                : "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          #{rank}
                        </span>
                      </td>

                      {/* Technical Institution Details */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          <span style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "0.85rem" }}>
                            {inst.name}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.7rem",
                                color: "var(--accent-saffron)",
                                background: "rgba(249, 115, 22, 0.1)",
                                padding: "0.1rem 0.35rem",
                                borderRadius: "4px",
                                border: "1px solid rgba(249, 115, 22, 0.2)",
                              }}
                            >
                              {inst.aicte_permanent_id}
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                              <MapPin size={11} />
                              {inst.district}, {inst.state}
                            </span>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                color: "var(--text-secondary)",
                                background: "rgba(255, 255, 255, 0.05)",
                                padding: "0.1rem 0.3rem",
                                borderRadius: "3px",
                              }}
                            >
                              {inst.institution_type}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Hotspot Regulatory Status & Dynamic Credit Score */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        {inst.trust_score !== undefined && (
                          <div style={{ marginBottom: "0.35rem" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                fontFamily: "var(--font-mono)",
                                color:
                                  inst.trust_score < 400
                                    ? "#EF4444"
                                    : inst.trust_score < 700
                                    ? "#F59E0B"
                                    : "#10B981",
                                background:
                                  inst.trust_score < 400
                                    ? "rgba(239, 68, 68, 0.15)"
                                    : inst.trust_score < 700
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : "rgba(16, 185, 129, 0.15)",
                                border: `1px solid ${
                                  inst.trust_score < 400
                                    ? "rgba(239, 68, 68, 0.35)"
                                    : inst.trust_score < 700
                                    ? "rgba(245, 158, 11, 0.35)"
                                    : "rgba(16, 185, 129, 0.35)"
                                }`,
                                padding: "0.15rem 0.45rem",
                                borderRadius: "4px",
                              }}
                            >
                              <span>{inst.trust_score} / 1000</span>
                              <span style={{ opacity: 0.85 }}>({inst.trust_grade})</span>
                            </span>
                          </div>
                        )}
                        {isCritical && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            <span
                              className="badge badge-urgent"
                              style={{
                                fontSize: "0.7rem",
                                padding: "0.2rem 0.5rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                width: "fit-content",
                              }}
                            >
                              <AlertOctagon size={12} />
                              <span>CRITICAL INTERVENTION</span>
                            </span>
                            <span style={{ fontSize: "0.68rem", color: "#F87171" }}>
                              Regulatory audit warranted
                            </span>
                          </div>
                        )}
                        {isWatchlist && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            <span
                              className="badge badge-high"
                              style={{
                                fontSize: "0.7rem",
                                padding: "0.2rem 0.5rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                width: "fit-content",
                              }}
                            >
                              <AlertTriangle size={12} />
                              <span>WATCHLIST</span>
                            </span>
                            <span style={{ fontSize: "0.68rem", color: "#FDBA74" }}>
                              Elevated turnaround delay
                            </span>
                          </div>
                        )}
                        {isCompliant && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            <span
                              style={{
                                background: "rgba(16, 185, 129, 0.15)",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                color: "#10B981",
                                fontSize: "0.7rem",
                                padding: "0.2rem 0.5rem",
                                borderRadius: "4px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                fontWeight: 700,
                                width: "fit-content",
                              }}
                            >
                              <CheckCircle2 size={12} />
                              <span>COMPLIANT</span>
                            </span>
                            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                              Within standard SLA
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Complaint Volume Breakdown */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                            <span style={{ fontWeight: 800, color: "#FFFFFF", fontFamily: "var(--font-mono)" }}>
                              {inst.total_cases} total
                            </span>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>
                              {inst.open_cases} open / {inst.resolved_cases} res
                            </span>
                          </div>
                          {/* Mini visual split bar */}
                          <div
                            style={{
                              width: "100%",
                              height: "4px",
                              background: "rgba(255, 255, 255, 0.08)",
                              borderRadius: "2px",
                              overflow: "hidden",
                              display: "flex",
                            }}
                          >
                            <div
                              style={{
                                width: `${resolvedPct}%`,
                                height: "100%",
                                background: "#10B981",
                              }}
                              title={`Resolved: ${inst.resolved_cases}`}
                            />
                            <div
                              style={{
                                width: `${openPct}%`,
                                height: "100%",
                                background: "#38BDF8",
                              }}
                              title={`Active Open: ${inst.open_cases}`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* SLA Adherence & Overdue Breaches */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        {inst.overdue_cases > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                            <span
                              style={{
                                color: "#EF4444",
                                fontWeight: 800,
                                fontSize: "0.82rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              <AlertOctagon size={13} color="#EF4444" />
                              {inst.overdue_cases} Overdue SLA
                            </span>
                            {inst.approaching_cases > 0 && (
                              <span style={{ color: "#F59E0B", fontSize: "0.7rem" }}>
                                +{inst.approaching_cases} near deadline
                              </span>
                            )}
                          </div>
                        ) : inst.approaching_cases > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                            <span
                              style={{
                                color: "#F59E0B",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                              }}
                            >
                              <Clock size={13} color="#F59E0B" />
                              {inst.approaching_cases} Approaching
                            </span>
                            <span style={{ color: "var(--risk-normal)", fontSize: "0.68rem" }}>
                              0 Overdue breaches
                            </span>
                          </div>
                        ) : (
                          <span
                            style={{
                              color: "var(--risk-normal)",
                              fontSize: "0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <CheckCircle2 size={13} />
                            <span>100% Within SLA</span>
                          </span>
                        )}
                      </td>

                      {/* Resolution Rate % */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span
                              style={{
                                fontSize: "0.95rem",
                                fontWeight: 800,
                                fontFamily: "var(--font-mono)",
                                color:
                                  inst.resolution_rate_pct >= 70
                                    ? "#10B981"
                                    : inst.resolution_rate_pct >= 40
                                    ? "#38BDF8"
                                    : "#EF4444",
                              }}
                            >
                              {inst.resolution_rate_pct.toFixed(1)}%
                            </span>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                              {inst.resolved_cases}/{inst.total_cases}
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "4px",
                              background: "rgba(255, 255, 255, 0.08)",
                              borderRadius: "2px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(inst.resolution_rate_pct, 100)}%`,
                                height: "100%",
                                background:
                                  inst.resolution_rate_pct >= 70
                                    ? "linear-gradient(90deg, #059669, #10B981)"
                                    : inst.resolution_rate_pct >= 40
                                    ? "linear-gradient(90deg, #0284C7, #38BDF8)"
                                    : "linear-gradient(90deg, #DC2626, #EF4444)",
                                borderRadius: "2px",
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Recurring Malpractice Themes */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                          {inst.top_recurring_categories && inst.top_recurring_categories.length > 0 ? (
                            inst.top_recurring_categories.map((catItem, cIdx) => (
                              <span
                                key={cIdx}
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "0.15rem 0.4rem",
                                  borderRadius: "4px",
                                  background: isCritical
                                    ? "rgba(239, 68, 68, 0.12)"
                                    : "rgba(255, 255, 255, 0.05)",
                                  border: isCritical
                                    ? "1px solid rgba(239, 68, 68, 0.25)"
                                    : "1px solid rgba(255, 255, 255, 0.1)",
                                  color: isCritical ? "#FCA5A5" : "var(--text-secondary)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                }}
                              >
                                <span>{catItem.category}</span>
                                <strong style={{ color: "#FFFFFF" }}>({catItem.count})</strong>
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                              No recurrent clusters
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              fontSize: "0.72rem",
                              padding: "0.3rem 0.55rem",
                              background: selectedInstitutionId === inst.institution_id ? "rgba(37, 99, 235, 0.25)" : undefined,
                              borderColor: selectedInstitutionId === inst.institution_id ? "var(--accent-aicte-blue)" : undefined,
                              color: selectedInstitutionId === inst.institution_id ? "#38BDF8" : undefined,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                            onClick={() => {
                              setSelectedInstitutionId(selectedInstitutionId === inst.institution_id ? "" : inst.institution_id);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            title={`Filter entire dashboard metrics to ${inst.name}`}
                          >
                            <Building size={12} />
                            <span>{selectedInstitutionId === inst.institution_id ? "Active Scope" : "Scope"}</span>
                          </button>

                          {onNavigateToRegister && (
                            <button
                              className="btn btn-secondary"
                              style={{
                                fontSize: "0.72rem",
                                padding: "0.3rem 0.55rem",
                                gap: "0.3rem",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                              onClick={() => onNavigateToRegister(undefined, inst.aicte_permanent_id)}
                              title={`Filter Case Register for ${inst.name}`}
                            >
                              <span>Dossiers</span>
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* League Table Footer Note */}
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div>
            Showing <strong>{filteredInstitutions.length}</strong> of <strong>{institutions.length}</strong> ranked technical institutions
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }} />
              Critical: &ge;3 Overdue SLA or &lt;35% resolution
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F97316" }} />
              Watchlist: &ge;1 Overdue or &ge;5 pending cases
            </span>
          </div>
        </div>
      </div>

      {/* Section 5: Categorical Distribution & Priority Profile */}
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
