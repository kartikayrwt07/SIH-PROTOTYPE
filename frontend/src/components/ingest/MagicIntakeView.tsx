import React, { useState } from "react";
import {
  Wand2,
  Sparkles,
  Building2,
  Tag,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Send,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Clock,
  User,
} from "lucide-react";
import { api } from "../../services/api";
import {
  MagicAnalysisResult,
  MagicIngestResponse,
} from "../../types";

interface MagicIntakeViewProps {
  onSelectCase?: (caseRef: string) => void;
  onNavigateToRegister?: () => void;
}

const PRESET_SCENARIOS = [
  {
    title: "Ragging & Dorm Bullying",
    bureau: "STU (Student Welfare)",
    priority: "URGENT",
    college: "Bharati Institute of Tech",
    badgeColor: "#EF4444",
    text: "I am a first-year student at Bharati Institute of Technology & Science. In the hostel dormitory, third-year seniors forced us to stand in cold water overnight and threatened us with severe violence if we reported to the warden. Multiple junior students are facing extreme intimidation and physical harm.",
  },
  {
    title: "Fee Extortion & Deposit Refund",
    bureau: "FIN (Finance Bureau)",
    priority: "HIGH",
    college: "Sahyadri Engineering College",
    badgeColor: "#F59E0B",
    text: "Sahyadri Engineering College is refusing to refund my caution money deposit of Rs 50,000 despite completing the withdrawal process. Accounts office is demanding an additional unapproved building fund donation before releasing my original 12th grade marksheets.",
  },
  {
    title: "Unapproved AI Course & Lab Deficit",
    bureau: "APPR (Approval Bureau)",
    priority: "HIGH",
    college: "Avadh Institute of Engg",
    badgeColor: "#3B82F6",
    text: "Avadh Institute of Engineering & Research has enrolled over 120 students in an unauthorized B.Tech Artificial Intelligence degree that has zero AICTE approval. The campus lacks basic laboratory equipment, computers, and sanctioned faculty for this curriculum.",
  },
  {
    title: "Faculty 7th Pay Arrears",
    bureau: "FDC (Faculty Cell)",
    priority: "MEDIUM",
    college: "Vellore Metropolitan Tech",
    badgeColor: "#10B981",
    text: "Faculty members at Vellore Metropolitan Technical Institute have not received our 7th Central Pay Commission salary arrears for the last 9 months. Management is making illegal salary deductions and threatening immediate termination if teachers question the delay.",
  },
];

export const MagicIntakeView: React.FC<MagicIntakeViewProps> = ({
  onSelectCase,
  onNavigateToRegister,
}) => {
  const [grievanceText, setGrievanceText] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [studentEmail, setStudentEmail] = useState<string>("");
  const [studentPhone, setStudentPhone] = useState<string>("");
  const [showComplainantDetails, setShowComplainantDetails] = useState<boolean>(false);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isDocketing, setIsDocketing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<MagicAnalysisResult | null>(null);
  const [docketResponse, setDocketResponse] = useState<MagicIngestResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApplyPreset = (presetText: string) => {
    setGrievanceText(presetText);
    setAnalysisResult(null);
    setDocketResponse(null);
    setErrorMessage(null);
  };

  const handleAnalyzeOnly = async () => {
    if (!grievanceText.trim() || grievanceText.trim().length < 15) {
      setErrorMessage("Please enter at least 15 characters describing the grievance.");
      return;
    }
    setErrorMessage(null);
    setIsAnalyzing(true);
    try {
      const res = await api.magicAnalyze({
        grievance_text: grievanceText.trim(),
        student_name: studentName.trim() || undefined,
        student_email: studentEmail.trim() || undefined,
        student_phone: studentPhone.trim() || undefined,
        auto_docket: false,
      });

      if (res.success && res.data) {
        setAnalysisResult(res.data);
      } else {
        setErrorMessage(res.error?.message || "Failed to analyze grievance text.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error connecting to AI triage service.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInstantDocket = async () => {
    if (!grievanceText.trim() || grievanceText.trim().length < 15) {
      setErrorMessage("Please enter at least 15 characters describing the grievance.");
      return;
    }
    setErrorMessage(null);
    setIsDocketing(true);
    try {
      const res = await api.magicIngest({
        grievance_text: grievanceText.trim(),
        student_name: studentName.trim() || undefined,
        student_email: studentEmail.trim() || undefined,
        student_phone: studentPhone.trim() || undefined,
        auto_docket: true,
      });

      if (res.success && res.data) {
        setDocketResponse(res.data);
        setAnalysisResult(res.data.analysis);
      } else {
        setErrorMessage(res.error?.message || "Failed to complete autonomous docketing.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error connecting to AI docketing engine.");
    } finally {
      setIsDocketing(false);
    }
  };

  const handleReset = () => {
    setGrievanceText("");
    setStudentName("");
    setStudentEmail("");
    setStudentPhone("");
    setAnalysisResult(null);
    setDocketResponse(null);
    setErrorMessage(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Hero Header */}
      <div
        className="card-base"
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1px solid rgba(249, 115, 22, 0.25)",
          padding: "1.75rem 2rem",
          borderRadius: "14px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-30px",
            right: "-20px",
            width: "220px",
            height: "220px",
            background: "radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
          <span
            style={{
              background: "rgba(249, 115, 22, 0.18)",
              border: "1px solid rgba(249, 115, 22, 0.4)",
              color: "var(--accent-saffron-light)",
              padding: "0.25rem 0.65rem",
              borderRadius: "9999px",
              fontSize: "0.72rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <Sparkles size={12} color="var(--accent-saffron)" />
            Zero-Shot Autonomous AI Ingestion
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>• 384-D Dense Semantic Vector Space</span>
        </div>

        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
          The "Magic" Grievance Intake
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.5, maxWidth: "860px" }}>
          Paste any raw, unstructured student or faculty complaint below. The AI instantly extracts the institution name,
          evaluates statutory violation categories, assigns risk priority, and routes the docket directly to the correct AICTE bureau
          without human intervention.
        </p>
      </div>

      {/* Preset Evaluation Scenarios */}
      <div className="card-base" style={{ padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Wand2 size={16} color="var(--accent-saffron)" />
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Quick-Fill Evaluator Test Cases
            </span>
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Click any scenario to populate live AI grievance
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "0.75rem" }}>
          {PRESET_SCENARIOS.map((sc, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyPreset(sc.text)}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                padding: "0.85rem",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-saffron)";
                e.currentTarget.style.background = "rgba(249, 115, 22, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "0.82rem", color: "#FFFFFF" }}>{sc.title}</strong>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.4rem",
                    borderRadius: "4px",
                    background: `${sc.badgeColor}25`,
                    color: sc.badgeColor,
                    border: `1px solid ${sc.badgeColor}50`,
                  }}
                >
                  {sc.priority}
                </span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--accent-saffron-light)" }}>
                Expected Bureau: {sc.bureau}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                College: {sc.college}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grievance Input Form */}
      <div className="card-base" style={{ padding: "1.75rem 2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.88rem", fontWeight: 700, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <span>Unstructured Grievance Narrative</span>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-saffron)", fontWeight: 500 }}>(Paste natural language text)</span>
          </label>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {grievanceText.length} characters
          </span>
        </div>

        <textarea
          rows={6}
          value={grievanceText}
          onChange={(e) => setGrievanceText(e.target.value)}
          placeholder="Paste or write student grievance here... e.g. 'I am a first-year student at Bharati Institute of Technology & Science. In the hostel dormitory, seniors forced junior students to stand in cold water and threatened us with physical harm...'"
          style={{
            width: "100%",
            padding: "1rem",
            background: "rgba(11, 19, 43, 0.8)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            color: "#FFFFFF",
            fontSize: "0.92rem",
            lineHeight: 1.6,
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.4)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-saffron)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
        />

        {/* Collapsible Complainant Details (Optional) */}
        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            onClick={() => setShowComplainantDetails(!showComplainantDetails)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--accent-saffron-light)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0",
            }}
          >
            <User size={14} />
            <span>{showComplainantDetails ? "Hide Complainant Details (Optional)" : "+ Add Complainant Details (Optional / Anonymous by default)"}</span>
          </button>

          {showComplainantDetails && (
            <div
              style={{
                marginTop: "0.75rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.75rem",
                padding: "1rem",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Student Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    background: "rgba(11, 19, 43, 0.9)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Student Email
                </label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@college.edu"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    background: "rgba(11, 19, 43, 0.9)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="9876543210"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    background: "rgba(11, 19, 43, 0.9)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.85rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            disabled={isAnalyzing || isDocketing}
            onClick={handleInstantDocket}
            style={{
              padding: "0.75rem 1.4rem",
              background: "linear-gradient(135deg, var(--accent-saffron) 0%, #EA580C 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.92rem",
              cursor: isAnalyzing || isDocketing ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55rem",
              boxShadow: "0 4px 15px rgba(249, 115, 22, 0.4)",
              transition: "all 0.2s ease",
            }}
          >
            {isDocketing ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Ingesting & Routing...
              </>
            ) : (
              <>
                <Send size={18} /> Instant Magic Docket (Autonomous)
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isAnalyzing || isDocketing}
            onClick={handleAnalyzeOnly}
            style={{
              padding: "0.75rem 1.25rem",
              background: "rgba(37, 99, 235, 0.12)",
              border: "1px solid rgba(37, 99, 235, 0.35)",
              color: "#60A5FA",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: isAnalyzing || isDocketing ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s ease",
            }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Analyzing NLP...
              </>
            ) : (
              <>
                <Wand2 size={16} /> Preview AI Extraction Only
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: "0.75rem 1rem",
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              borderRadius: "8px",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <RefreshCw size={14} /> Clear Form
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div
            style={{
              marginTop: "1.25rem",
              padding: "0.85rem 1rem",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid var(--risk-overdue)",
              borderRadius: "8px",
              color: "#FCA5A5",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.85rem",
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Case Docketed Success Alert Banner */}
      {docketResponse && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 95, 70, 0.2) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.5)",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={24} color="#10B981" />
            </div>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#FFFFFF" }}>
                Case Successfully Docketed:{" "}
                <span style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>
                  {docketResponse.case_reference_id}
                </span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "#D1FAE5", marginTop: "0.2rem" }}>
                Autonomously bound to {docketResponse.analysis.extracted_college.name} &bull; Routed to {docketResponse.analysis.bureau_routing.bureau_name}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            {onSelectCase && docketResponse.case_reference_id && (
              <button
                type="button"
                onClick={() => onSelectCase(docketResponse.case_reference_id!)}
                style={{
                  padding: "0.6rem 1rem",
                  background: "#10B981",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span>View in Case Dossier</span>
                <ArrowRight size={14} />
              </button>
            )}

            {onNavigateToRegister && (
              <button
                type="button"
                onClick={onNavigateToRegister}
                style={{
                  padding: "0.6rem 0.9rem",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                View Case Register
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live AI Extraction HUD (Heads-Up Display) */}
      {analysisResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={18} color="var(--accent-saffron)" />
              AI Neural Extraction Breakdown
            </h2>
            <span style={{ fontSize: "0.78rem", color: "var(--accent-saffron)", fontWeight: 600 }}>
              Autonomous Ingestion Confidence: {Math.round(analysisResult.bureau_routing.confidence * 100)}%
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {/* 1. Extracted College */}
            <div
              className="card-base"
              style={{
                padding: "1.25rem",
                borderLeft: "4px solid var(--accent-aicte-blue)",
                background: "rgba(18, 28, 56, 0.85)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                <Building2 size={18} color="var(--accent-aicte-blue)" />
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 700 }}>
                  1. Extracted Institution
                </span>
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.4rem", lineHeight: 1.3 }}>
                {analysisResult.extracted_college.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    background: analysisResult.extracted_college.is_database_match ? "rgba(16, 185, 129, 0.15)" : "rgba(249, 115, 22, 0.15)",
                    color: analysisResult.extracted_college.is_database_match ? "#34D399" : "var(--accent-saffron)",
                    fontWeight: 600,
                    border: analysisResult.extracted_college.is_database_match ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(249, 115, 22, 0.3)",
                  }}
                >
                  {analysisResult.extracted_college.is_database_match ? "✓ Registered AICTE Database" : "Provisional Extraction"}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                  Matched: "{analysisResult.extracted_college.matched_phrase}"
                </span>
              </div>
              {analysisResult.extracted_college.state && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                  Jurisdiction: {analysisResult.extracted_college.district}, {analysisResult.extracted_college.state}
                </div>
              )}
            </div>

            {/* 2. Detected Category */}
            <div
              className="card-base"
              style={{
                padding: "1.25rem",
                borderLeft: "4px solid #8B5CF6",
                background: "rgba(18, 28, 56, 0.85)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                <Tag size={18} color="#8B5CF6" />
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 700 }}>
                  2. Grievance Category
                </span>
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.4rem" }}>
                {analysisResult.categorization.category}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.6rem" }}>
                Semantic Classification: {Math.round(analysisResult.categorization.confidence * 100)}% match
              </div>
              {analysisResult.categorization.detected_signals.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {analysisResult.categorization.detected_signals.map((sig, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.68rem",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                        background: "rgba(139, 92, 246, 0.15)",
                        color: "#C4B5FD",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                      }}
                    >
                      #{sig}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Assigned Priority & SLA */}
            <div
              className="card-base"
              style={{
                padding: "1.25rem",
                borderLeft: `4px solid ${
                  analysisResult.priority_assignment.priority === "URGENT" ? "var(--risk-overdue)" : "var(--accent-saffron)"
                }`,
                background: "rgba(18, 28, 56, 0.85)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                <Clock
                  size={18}
                  color={analysisResult.priority_assignment.priority === "URGENT" ? "var(--risk-overdue)" : "var(--accent-saffron)"}
                />
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 700 }}>
                  3. Assigned Priority & SLA
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "4px",
                    background:
                      analysisResult.priority_assignment.priority === "URGENT"
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(249, 115, 22, 0.2)",
                    color:
                      analysisResult.priority_assignment.priority === "URGENT"
                        ? "var(--risk-overdue)"
                        : "var(--accent-saffron)",
                    border: `1px solid ${
                      analysisResult.priority_assignment.priority === "URGENT"
                        ? "rgba(239, 68, 68, 0.4)"
                        : "rgba(249, 115, 22, 0.4)"
                    }`,
                  }}
                >
                  {analysisResult.priority_assignment.priority}
                </span>
                <span style={{ fontSize: "0.82rem", color: "#FFFFFF", fontWeight: 700 }}>
                  {analysisResult.priority_assignment.sla_hours}h SLA Turnaround
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {analysisResult.priority_assignment.rationale}
              </div>
            </div>

            {/* 4. Autonomous Bureau Routing */}
            <div
              className="card-base"
              style={{
                padding: "1.25rem",
                borderLeft: "4px solid #10B981",
                background: "rgba(18, 28, 56, 0.85)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                <ShieldAlert size={18} color="#10B981" />
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 700 }}>
                  4. Autonomous Bureau Routing
                </span>
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.3rem" }}>
                {analysisResult.bureau_routing.bureau_name}{" "}
                <span style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>
                  ({analysisResult.bureau_routing.bureau_code})
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.5rem" }}>
                {analysisResult.bureau_routing.routing_rationale}
              </div>

              {/* Bureau Affinity Distribution Bars */}
              <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.5rem" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Bureau Semantic Affinities:
                </span>
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem" }}>
                  {Object.entries(analysisResult.bureau_routing.all_scores).map(([code, sc]) => (
                    <div
                      key={code}
                      style={{
                        flex: 1,
                        background: code === analysisResult.bureau_routing.bureau_code ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.03)",
                        border: code === analysisResult.bureau_routing.bureau_code ? "1px solid #10B981" : "1px solid var(--border-subtle)",
                        borderRadius: "4px",
                        padding: "0.2rem 0.35rem",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: code === analysisResult.bureau_routing.bureau_code ? "#34D399" : "var(--text-muted)" }}>
                        {code}
                      </div>
                      <div style={{ fontSize: "0.62rem", color: code === analysisResult.bureau_routing.bureau_code ? "#FFFFFF" : "var(--text-secondary)" }}>
                        {Math.round(sc * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
