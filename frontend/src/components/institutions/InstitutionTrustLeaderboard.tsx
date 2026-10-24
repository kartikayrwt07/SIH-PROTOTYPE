import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Award, AlertTriangle, TrendingDown, RefreshCw, CheckCircle,
  MapPin, Scale, ChevronRight, X, Send, AlertOctagon
} from "lucide-react";
import { api } from "../../services/api";
import type {
  InstitutionTrustScoreDetail,
  TrustLeaderboardSummary,
} from "../../types";

interface Props {
  onSelectCase?: (caseRef: string) => void;
}

export const InstitutionTrustLeaderboard: React.FC<Props> = ({ onSelectCase }) => {
  const [institutions, setInstitutions] = useState<InstitutionTrustScoreDetail[]>([]);
  const [summary, setSummary] = useState<TrustLeaderboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [sortOrder, setSortOrder] = useState<"worst_first" | "best_first">("worst_first");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [availableStates, setAvailableStates] = useState<string[]>([]);

  // Modal Dossier state
  const [activeDossier, setActiveDossier] = useState<InstitutionTrustScoreDetail | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.getInstitutionTrustScores({
          sort_order: sortOrder,
          risk_level: selectedRiskLevel !== "ALL" ? selectedRiskLevel : undefined,
          state: selectedState !== "ALL" ? selectedState : undefined,
          limit: 100,
        }),
        api.getTrustScoresSummary(selectedState !== "ALL" ? selectedState : undefined),
      ]);

      if (listRes.success && listRes.data) {
        setInstitutions(listRes.data);
        const states = Array.from(new Set(listRes.data.map((i) => i.state).filter(Boolean))).sort();
        setAvailableStates(states);
      } else {
        setError(listRes.error?.message || "Failed to load institution trust scores");
      }

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to trust score engine");
    } finally {
      setLoading(false);
    }
  }, [sortOrder, selectedRiskLevel, selectedState]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open detailed dossier
  const handleOpenDossier = async (instId: string) => {
    setActionSuccessMsg(null);
    try {
      const res = await api.getInstitutionTrustDetail(instId);
      if (res.success && res.data) {
        setActiveDossier(res.data);
      }
    } catch {
      // fallback to existing item
      const fallback = institutions.find((i) => i.institution_id === instId);
      if (fallback) setActiveDossier(fallback);
    }
  };

  // Dispatch automated regulatory action
  const handleExecuteAction = async (actionType: string) => {
    if (!activeDossier) return;
    setActionSubmitting(true);
    setActionSuccessMsg(null);
    try {
      const res = await api.executeRegulatoryAction(activeDossier.institution_id, {
        action_type: actionType,
        directive_notes: `Triggered by AICTE Super Admin Leaderboard oversight console for ${activeDossier.name} (Credit Score: ${activeDossier.trust_score}/1000).`,
      });
      if (res.success && res.data) {
        setActionSuccessMsg(res.data.message);
        // Refresh leaderboard after action
        fetchData();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed to execute");
    } finally {
      setActionSubmitting(false);
    }
  };

  // Filtered view
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return institutions;
    const q = searchTerm.toLowerCase();
    return institutions.filter(
      (inst) =>
        inst.name.toLowerCase().includes(q) ||
        inst.aicte_permanent_id.toLowerCase().includes(q) ||
        inst.district.toLowerCase().includes(q) ||
        inst.state.toLowerCase().includes(q)
    );
  }, [institutions, searchTerm]);

  // Helpers for score color
  const getScoreColor = (score: number) => {
    if (score >= 850) return "#10B981"; // Emerald
    if (score >= 700) return "#06B6D4"; // Cyan
    if (score >= 550) return "#3B82F6"; // Blue
    if (score >= 400) return "#F59E0B"; // Amber
    if (score >= 250) return "#F97316"; // Orange
    return "#EF4444"; // Crimson Red
  };

  const getScoreBadgeBg = (score: number) => {
    if (score >= 850) return "rgba(16, 185, 129, 0.12)";
    if (score >= 700) return "rgba(6, 182, 212, 0.12)";
    if (score >= 550) return "rgba(59, 130, 246, 0.12)";
    if (score >= 400) return "rgba(245, 158, 11, 0.12)";
    if (score >= 250) return "rgba(249, 115, 22, 0.15)";
    return "rgba(239, 68, 68, 0.18)";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ maxWidth: "650px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#EF4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "0.2rem 0.6rem",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              <AlertOctagon size={13} />
              Automated Oversight Engine
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Dynamic Credit Scoring</span>
          </div>

          <h2 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em", margin: 0 }}>
            Institution Trust & Risk Leaderboard
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.4rem", lineHeight: 1.5 }}>
            Real-time dynamic credit rating (0–1000) for all AICTE technical colleges. Overdue SLA breaches and severe
            verified complaints deduct points, automatically elevating worst-performing institutions into regulatory red zones.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1rem",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "8px",
            color: "#FFFFFF",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={15} className={loading ? "spin" : ""} />
          <span>Recalculate Scores</span>
        </button>
      </div>

      {/* KPI Overview Tiles */}
      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* National Average */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "1.25rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                National Average Score
              </span>
              <Award size={18} color="var(--accent-aicte-blue)" />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.5rem" }}>
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  fontFamily: "var(--font-mono)",
                  color: getScoreColor(summary.national_average_score),
                }}
              >
                {summary.national_average_score}
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/ 1000</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              Across {summary.total_institutions} technical institutions
            </div>
          </div>

          {/* Critical Red Zone */}
          <div
            style={{
              background: "rgba(239, 68, 68, 0.06)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "#EF4444", fontWeight: 700 }}>Critical Red Zone (&lt;400)</span>
              <AlertTriangle size={18} color="#EF4444" />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.5rem" }}>
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  fontFamily: "var(--font-mono)",
                  color: "#EF4444",
                }}
              >
                {summary.critical_risk_count}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#EF4444", fontWeight: 600 }}>Sanctions Triggered</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
              Mandatory inspection & quota freeze
            </div>
          </div>

          {/* High Risk / Watchlist */}
          <div
            style={{
              background: "rgba(245, 158, 11, 0.06)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "12px",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "#F59E0B", fontWeight: 700 }}>High Risk / Watchlist</span>
              <TrendingDown size={18} color="#F59E0B" />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.5rem" }}>
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  fontFamily: "var(--font-mono)",
                  color: "#F59E0B",
                }}
              >
                {summary.high_risk_count + summary.watchlist_count}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#F59E0B", fontWeight: 600 }}>Under Scrutiny</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
              Show-cause warnings & ATR audits
            </div>
          </div>

          {/* Total SLA Breaches */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                Total Active SLA Breaches
              </span>
              <Scale size={18} color="var(--accent-saffron)" />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.5rem" }}>
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent-saffron)",
                }}
              >
                {summary.total_sla_breaches}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>cases overdue</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              Deducted {summary.total_penalties_deducted} net credit points
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Sorting */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          background: "rgba(15, 23, 42, 0.7)",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Search box */}
          <input
            type="text"
            placeholder="Search college name, AICTE ID, district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              padding: "0.5rem 0.85rem",
              color: "#FFFFFF",
              fontSize: "0.85rem",
              width: "280px",
              outline: "none",
            }}
          />

          {/* Risk Level Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>RISK:</span>
            <select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                padding: "0.5rem 0.75rem",
                color: "#FFFFFF",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="CRITICAL">Critical Red Zone (&lt;400)</option>
              <option value="HIGH">High Risk (400–549)</option>
              <option value="MODERATE">Moderate Scrutiny (550–699)</option>
              <option value="LOW">Exemplary / Compliant (≥700)</option>
            </select>
          </div>

          {/* State Filter */}
          {availableStates.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>STATE:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{
                  background: "rgba(0, 0, 0, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  padding: "0.5rem 0.75rem",
                  color: "#FFFFFF",
                  fontSize: "0.85rem",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All States</option>
                {availableStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Sort Order Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>SORT ORDER:</span>
          <div
            style={{
              display: "flex",
              background: "rgba(0, 0, 0, 0.4)",
              borderRadius: "8px",
              padding: "2px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <button
              onClick={() => setSortOrder("worst_first")}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                background: sortOrder === "worst_first" ? "#EF4444" : "transparent",
                color: sortOrder === "worst_first" ? "#FFFFFF" : "var(--text-muted)",
              }}
            >
              Worst-Performing First (High Risk)
            </button>
            <button
              onClick={() => setSortOrder("best_first")}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                background: sortOrder === "best_first" ? "#10B981" : "transparent",
                color: sortOrder === "best_first" ? "#FFFFFF" : "var(--text-muted)",
              }}
            >
              Highest Trust First
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      {error ? (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            padding: "1.5rem",
            color: "#EF4444",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <RefreshCw size={24} className="spin" style={{ margin: "0 auto 0.75rem" }} />
          <div>Computing dynamic credit scores across AICTE institutions...</div>
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          No technical institutions match the selected risk filters.
        </div>
      ) : (
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(0, 0, 0, 0.3)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <th style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Rank</th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Institution & Location</th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Trust Credit Score</th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Penalty Deductions</th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Automated Regulatory Directive</th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((inst, index) => {
                const isCritical = inst.trust_score < 400;
                const scoreColor = getScoreColor(inst.trust_score);

                return (
                  <tr
                    key={inst.institution_id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      background: isCritical ? "rgba(239, 68, 68, 0.03)" : "transparent",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isCritical
                        ? "rgba(239, 68, 68, 0.08)"
                        : "rgba(255, 255, 255, 0.03)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isCritical ? "rgba(239, 68, 68, 0.03)" : "transparent";
                    }}
                  >
                    {/* Rank */}
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          fontFamily: "var(--font-mono)",
                          background:
                            index < 3 && sortOrder === "worst_first"
                              ? "rgba(239, 68, 68, 0.25)"
                              : "rgba(255, 255, 255, 0.06)",
                          color:
                            index < 3 && sortOrder === "worst_first" ? "#EF4444" : "var(--text-secondary)",
                          border:
                            index < 3 && sortOrder === "worst_first"
                              ? "1px solid rgba(239, 68, 68, 0.5)"
                              : "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        #{index + 1}
                      </span>
                    </td>

                    {/* Name & Details */}
                    <td style={{ padding: "1rem", maxWidth: "280px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "0.9rem" }}>{inst.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.7rem",
                              color: "var(--accent-saffron)",
                              background: "rgba(249, 115, 22, 0.1)",
                              padding: "0.1rem 0.4rem",
                              borderRadius: "4px",
                            }}
                          >
                            {inst.aicte_permanent_id}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <MapPin size={11} /> {inst.district}, {inst.state}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Score Gauge / Badge */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            background: getScoreBadgeBg(inst.trust_score),
                            border: `1px solid ${scoreColor}`,
                            borderRadius: "10px",
                            padding: "0.4rem 0.75rem",
                            textAlign: "center",
                            minWidth: "90px",
                          }}
                        >
                          <div style={{ fontSize: "1.25rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: scoreColor }}>
                            {inst.trust_score}
                          </div>
                          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: scoreColor, textTransform: "uppercase" }}>
                            {inst.trust_grade} • {inst.risk_level}
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div style={{ flex: 1, minWidth: "80px" }}>
                          <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${Math.min(100, Math.max(5, (inst.trust_score / 1000) * 100))}%`,
                                height: "100%",
                                background: scoreColor,
                                borderRadius: "3px",
                              }}
                            />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            <span>0</span>
                            <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                              {inst.risk_tier.split("•")[0]}
                            </span>
                            <span>1000</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Penalty Deductions */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                          {inst.deduction_breakdown.sla_breach_points > 0 && (
                            <span
                              style={{
                                background: "rgba(239, 68, 68, 0.15)",
                                color: "#EF4444",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                padding: "0.15rem 0.45rem",
                                borderRadius: "4px",
                              }}
                            >
                              -{inst.deduction_breakdown.sla_breach_points} pts ({inst.overdue_cases} Breaches)
                            </span>
                          )}
                          {inst.deduction_breakdown.severe_complaint_points > 0 && (
                            <span
                              style={{
                                background: "rgba(249, 115, 22, 0.15)",
                                color: "#F97316",
                                border: "1px solid rgba(249, 115, 22, 0.3)",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                padding: "0.15rem 0.45rem",
                                borderRadius: "4px",
                              }}
                            >
                              -{inst.deduction_breakdown.severe_complaint_points} pts (Severe)
                            </span>
                          )}
                          {inst.deduction_breakdown.master_ticket_points > 0 && (
                            <span
                              style={{
                                background: "rgba(168, 85, 247, 0.15)",
                                color: "#A855F7",
                                border: "1px solid rgba(168, 85, 247, 0.3)",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                padding: "0.15rem 0.45rem",
                                borderRadius: "4px",
                              }}
                            >
                              -{inst.deduction_breakdown.master_ticket_points} pts (Master Ticket Cluster)
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          Total Deductions: <b>-{inst.deduction_breakdown.total_deductions} pts</b> from baseline
                        </span>
                      </div>
                    </td>

                    {/* Automated Regulatory Directive */}
                    <td style={{ padding: "1rem", maxWidth: "260px" }}>
                      <div
                        style={{
                          background: isCritical ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.04)",
                          borderLeft: `3px solid ${scoreColor}`,
                          borderRadius: "4px",
                          padding: "0.45rem 0.65rem",
                          fontSize: "0.75rem",
                          lineHeight: 1.4,
                          color: isCritical ? "#FCA5A5" : "var(--text-secondary)",
                        }}
                      >
                        {inst.automated_directive}
                      </div>
                    </td>

                    {/* Action button */}
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => handleOpenDossier(inst.institution_id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.45rem 0.75rem",
                          background: isCritical ? "rgba(239, 68, 68, 0.2)" : "rgba(37, 99, 235, 0.15)",
                          border: isCritical ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(37, 99, 235, 0.3)",
                          color: isCritical ? "#EF4444" : "#38BDF8",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span>Audit Dossier</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Interactive Modal: Institution Credit Audit Dossier & Automated Action */}
      {activeDossier && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              background: "#0F172A",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "850px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span
                    style={{
                      background: getScoreBadgeBg(activeDossier.trust_score),
                      color: getScoreColor(activeDossier.trust_score),
                      border: `1px solid ${getScoreColor(activeDossier.trust_score)}`,
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                    }}
                  >
                    Grade {activeDossier.trust_grade} • {activeDossier.risk_tier}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    Permanent ID: <code>{activeDossier.aicte_permanent_id}</code>
                  </span>
                </div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                  {activeDossier.name}
                </h3>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  {activeDossier.district}, {activeDossier.state} &bull; {activeDossier.institution_type}
                </div>
              </div>

              <button
                onClick={() => setActiveDossier(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "0.4rem",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Success Notification */}
              {actionSuccessMsg && (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid #10B981",
                    borderRadius: "8px",
                    padding: "0.85rem 1rem",
                    color: "#A7F3D0",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <CheckCircle size={18} color="#10B981" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}

              {/* Credit Score & Deductions Ledger Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr",
                  gap: "1.25rem",
                }}
              >
                {/* Score Big Meter */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    border: `1px solid ${getScoreColor(activeDossier.trust_score)}`,
                    borderRadius: "12px",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Current Trust Credit Score
                  </span>
                  <div
                    style={{
                      fontSize: "3.5rem",
                      fontWeight: 900,
                      fontFamily: "var(--font-mono)",
                      color: getScoreColor(activeDossier.trust_score),
                      lineHeight: 1,
                      margin: "0.5rem 0",
                    }}
                  >
                    {activeDossier.trust_score}
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    out of 1000 Baseline
                  </span>
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      background: getScoreBadgeBg(activeDossier.trust_score),
                      color: getScoreColor(activeDossier.trust_score),
                    }}
                  >
                    Risk Level: {activeDossier.risk_level}
                  </div>
                </div>

                {/* Mathematical Penalty Breakdown Ledger */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                  }}
                >
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.75rem" }}>
                    Mathematical Penalty Ledger
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span>Baseline Institution Score</span>
                      <span style={{ fontWeight: 700, color: "#10B981" }}>+1000 pts</span>
                    </div>
                    {activeDossier.deduction_breakdown.sla_breach_points > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#EF4444" }}>
                        <span>Overdue SLA Breaches ({activeDossier.deduction_breakdown.sla_breaches_count} cases)</span>
                        <span style={{ fontWeight: 700 }}>-{activeDossier.deduction_breakdown.sla_breach_points} pts</span>
                      </div>
                    )}
                    {activeDossier.deduction_breakdown.severe_complaint_points > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#F97316" }}>
                        <span>Critical & Urgent Verified Grievances ({activeDossier.deduction_breakdown.severe_complaints_count})</span>
                        <span style={{ fontWeight: 700 }}>-{activeDossier.deduction_breakdown.severe_complaint_points} pts</span>
                      </div>
                    )}
                    {activeDossier.deduction_breakdown.sensitive_category_points > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#E11D48" }}>
                        <span>Statutory Sensitive Multiplier (Ragging / Fee Extortion)</span>
                        <span style={{ fontWeight: 700 }}>-{activeDossier.deduction_breakdown.sensitive_category_points} pts</span>
                      </div>
                    )}
                    {activeDossier.deduction_breakdown.master_ticket_points > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#A855F7" }}>
                        <span>Mass Student Complaint Clusters ({activeDossier.deduction_breakdown.master_ticket_clusters_count})</span>
                        <span style={{ fontWeight: 700 }}>-{activeDossier.deduction_breakdown.master_ticket_points} pts</span>
                      </div>
                    )}
                    {activeDossier.deduction_breakdown.recovery_bonus_points > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#10B981" }}>
                        <span>Resolution & Clean Streak Recovery Credits</span>
                        <span style={{ fontWeight: 700 }}>+{activeDossier.deduction_breakdown.recovery_bonus_points} pts</span>
                      </div>
                    )}
                    <div
                      style={{
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                        paddingTop: "0.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: 800,
                        color: "#FFFFFF",
                      }}
                    >
                      <span>Final Net Score</span>
                      <span style={{ color: getScoreColor(activeDossier.trust_score) }}>
                        {activeDossier.trust_score} / 1000
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automated Oversight Directive Banner */}
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "10px",
                  padding: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#EF4444", fontWeight: 700, fontSize: "0.85rem" }}>
                  <AlertTriangle size={16} />
                  <span>AICTE Regulatory Oversight Directive</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.35rem", lineHeight: 1.5 }}>
                  {activeDossier.automated_directive}
                </div>
              </div>

              {/* Itemized Case Citations (The specific complaints that dropped the score) */}
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.6rem" }}>
                  Specific Complaint Citations Accruing Penalties
                </div>
                {activeDossier.citations.length === 0 ? (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    No penalty citations found. Institution is operating with clean compliance.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {activeDossier.citations.map((c) => (
                      <div
                        key={c.case_reference_id}
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          borderRadius: "8px",
                          padding: "0.75rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <button
                              onClick={() => {
                                if (onSelectCase) onSelectCase(c.case_reference_id);
                              }}
                              style={{
                                background: "rgba(37, 99, 235, 0.2)",
                                border: "1px solid rgba(37, 99, 235, 0.4)",
                                color: "#38BDF8",
                                borderRadius: "4px",
                                padding: "0.1rem 0.4rem",
                                fontSize: "0.75rem",
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {c.case_reference_id}
                            </button>
                            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#FFFFFF" }}>
                              {c.subject}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            {c.deduction_reason} &bull; Filed on {c.created_at}
                          </div>
                        </div>

                        <span
                          style={{
                            background: "rgba(239, 68, 68, 0.2)",
                            color: "#EF4444",
                            fontWeight: 800,
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.8rem",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "6px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          -{c.points_deducted} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Automated Regulatory Action Controls */}
              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  paddingTop: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Trigger Automated Sanction as Super Admin:
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleExecuteAction("SHOW_CAUSE_NOTICE")}
                    disabled={actionSubmitting}
                    style={{
                      background: "rgba(249, 115, 22, 0.2)",
                      border: "1px solid #F97316",
                      color: "#F97316",
                      padding: "0.5rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <Send size={13} />
                    <span>Issue Show-Cause Notice</span>
                  </button>

                  <button
                    onClick={() => handleExecuteAction("FREEZE_INTAKE")}
                    disabled={actionSubmitting}
                    style={{
                      background: "rgba(239, 68, 68, 0.2)",
                      border: "1px solid #EF4444",
                      color: "#EF4444",
                      padding: "0.5rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <AlertOctagon size={13} />
                    <span>Freeze Intake Quota</span>
                  </button>

                  <button
                    onClick={() => handleExecuteAction("SCHEDULE_INSPECTION")}
                    disabled={actionSubmitting}
                    style={{
                      background: "rgba(59, 130, 246, 0.2)",
                      border: "1px solid #3B82F6",
                      color: "#60A5FA",
                      padding: "0.5rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <Scale size={13} />
                    <span>Surprise AICTE Inspection</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
