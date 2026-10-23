import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Building2,
  User,
  Shield,
  Clock,
  FileText,
  Lock,
  AlertCircle,
  EyeOff,
  History,
  Send,
  RotateCcw,
  ArrowRightLeft,
} from "lucide-react";
import { ComplaintCase, TimelineEvent, CaseNote } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { SlaBadge } from "../common/SlaBadge";
import { TimelineView } from "../timeline/TimelineView";
import { CaseTransitionModal } from "./CaseTransitionModal";
import { CaseReassignmentModal } from "./CaseReassignmentModal";
import { AiIntelligenceCard } from "../ai/AiIntelligenceCard";

interface CaseDetailViewProps {
  caseRef: string;
  onBack: () => void;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({ caseRef, onBack }) => {
  const { currentRole } = useAuth();
  const [caseData, setCaseData] = useState<ComplaintCase | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [activeTab, setActiveTab] = useState<"timeline" | "notes" | "institution">("timeline");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Transition modal state
  const [isTransitionOpen, setIsTransitionOpen] = useState<boolean>(false);
  const [isReassignOpen, setIsReassignOpen] = useState<boolean>(false);

  // Notes composer state
  const [noteContent, setNoteContent] = useState<string>("");
  const [isConfidential, setIsConfidential] = useState<boolean>(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const loadCaseDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [caseRes, timelineRes, notesRes] = await Promise.all([
        api.getCaseDetail(caseRef),
        api.getCaseTimeline(caseRef),
        api.getCaseNotes(caseRef),
      ]);

      if (caseRes.success && caseRes.data) {
        setCaseData(caseRes.data);
      } else {
        setError(caseRes.error?.message || "Failed to load case details.");
      }

      if (timelineRes.success && timelineRes.data) {
        setTimeline(timelineRes.data);
      }

      if (notesRes.success && notesRes.data) {
        setNotes(notesRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to case service");
    } finally {
      setIsLoading(false);
    }
  }, [caseRef]);

  useEffect(() => {
    loadCaseDetails();
  }, [loadCaseDetails]);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(caseRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    setNoteError(null);
    try {
      const res = await api.addCaseNote(caseRef, noteContent.trim(), isConfidential);
      if (res.success && res.data) {
        setNotes((prev) => [res.data!, ...prev]);
        setNoteContent("");
        setIsConfidential(false);
        // Refresh timeline because note creation logs NOTE_ADDED event
        const tlRes = await api.getCaseTimeline(caseRef);
        if (tlRes.success && tlRes.data) {
          setTimeline(tlRes.data);
        }
      } else {
        setNoteError(res.error?.message || "Failed to add note.");
      }
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Error saving note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card-base" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
        <Clock size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem auto" }} />
        Loading case dossier {caseRef}...
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="card-base" style={{ padding: "2rem", textAlign: "center" }}>
        <AlertCircle size={36} color="var(--risk-overdue)" style={{ margin: "0 auto 0.5rem auto" }} />
        <h3 style={{ color: "var(--text-primary)" }}>Case Dossier Unavailable</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{error || "Case record not found."}</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: "1rem" }}>
          <ArrowLeft size={16} /> Return to Case Register
        </button>
      </div>
    );
  }

  const isAuditor = currentRole === "AUDITOR";
  const isClosed = caseData.status === "Closed";
  const canAdvance = !isAuditor && !isClosed;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Navigation & Header Bar */}
      <div
        className="card-base"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1rem 1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            className="btn btn-secondary"
            onClick={onBack}
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
          >
            <ArrowLeft size={16} /> Register
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 800,
                  fontSize: "1.15rem",
                  color: "var(--accent-saffron)",
                }}
              >
                {caseData.case_reference_id}
              </span>
              <button
                onClick={handleCopyRef}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "2px",
                }}
                title="Copy reference ID"
              >
                {copied ? <Check size={14} color="var(--risk-normal)" /> : <Copy size={14} />}
              </button>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Registered: {new Date(caseData.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <SlaBadge dueDate={caseData.due_date} status={caseData.status} escalationLevel={caseData.escalation_level} />

          {canAdvance && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setIsReassignOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                title="Delegate or transfer case to another AICTE bureau or officer"
              >
                <ArrowRightLeft size={15} /> Transfer / Reassign
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setIsTransitionOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                {caseData.status === "Resolved" ? (
                  <>
                    <RotateCcw size={15} /> Reopen / Sign-off
                  </>
                ) : (
                  <>
                    <Shield size={15} /> Advance Status
                  </>
                )}
              </button>
            </>
          )}

          {isClosed && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                background: "rgba(100, 116, 139, 0.15)",
                padding: "0.3rem 0.6rem",
                borderRadius: "4px",
              }}
            >
              <Lock size={13} /> Case Terminal (Closed)
            </span>
          )}
        </div>
      </div>

      {/* Two-Column Responsive Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Dossier Context & Metadata */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Explainable AI Intelligence & Duplicate Detection Layer */}
          <AiIntelligenceCard
            currentCase={caseData}
            userRole={currentRole}
            onTriageApplied={loadCaseDetails}
          />

          {/* Case Overview Card */}
          <div className="card-base" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "var(--accent-aicte-blue)",
                }}
              >
                {caseData.category}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "var(--risk-approaching)",
                }}
              >
                Priority: {caseData.priority}
              </span>
            </div>

            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0.75rem 0 0.5rem 0",
                lineHeight: 1.4,
              }}
            >
              {caseData.subject}
            </h2>

            {/* Description */}
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.85rem",
                background: "rgba(15, 23, 42, 0.5)",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>
                Summary / Redacted Description
              </div>
              {caseData.description_redacted}
            </div>

            {/* Confidential Complainant Statement if available */}
            {caseData.description_confidential && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.85rem",
                  background: "rgba(245, 158, 11, 0.08)",
                  borderRadius: "6px",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  fontSize: "0.875rem",
                  color: "var(--text-primary)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--risk-approaching)",
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Lock size={12} /> Confidential Complainant Statement (Authorized Personnel Only)
                </div>
                {caseData.description_confidential}
              </div>
            )}

            {isAuditor && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.6rem 0.8rem",
                  background: "rgba(100, 116, 139, 0.15)",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <EyeOff size={14} /> Direct complainant identifying statements are redacted under Read-Only Auditor access.
              </div>
            )}

            {caseData.closure_remarks && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.75rem",
                  background: "rgba(16, 185, 129, 0.1)",
                  borderRadius: "6px",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--risk-normal)", marginBottom: "2px" }}>
                  Resolution / Closure Sign-off Remarks
                </div>
                {caseData.closure_remarks}
              </div>
            )}
          </div>

          {/* Bureau & Assignee Card */}
          <div className="card-base" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.75rem 0" }}>
              Jurisdiction & Ownership
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>Assigned Bureau</span>
                <strong style={{ color: "var(--text-primary)" }}>{caseData.bureau?.name || "AICTE Bureau"}</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--accent-aicte-blue)", fontFamily: "monospace" }}>
                  {caseData.bureau?.code}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>Active Officer</span>
                <strong style={{ color: "var(--text-primary)" }}>
                  {caseData.assigned_officer?.full_name || "Unassigned Queue"}
                </strong>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {caseData.assigned_officer?.email || "Pending officer intake"}
                </div>
              </div>
            </div>

            {canAdvance && (
              <button
                className="btn btn-secondary"
                onClick={() => setIsReassignOpen(true)}
                style={{
                  marginTop: "0.85rem",
                  width: "100%",
                  fontSize: "0.8rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0.45rem",
                }}
              >
                <ArrowRightLeft size={14} /> Reassign Bureau / Officer
              </button>
            )}
          </div>

          {/* Institution Card */}
          <div className="card-base" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Building2 size={18} color="var(--accent-saffron)" />
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Institution Profile
              </h3>
            </div>
            {caseData.institution ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{caseData.institution.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    AICTE ID: <span style={{ fontFamily: "monospace" }}>{caseData.institution.aicte_permanent_id}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "4px" }}>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Location</span>
                    <span>{caseData.institution.district}, {caseData.institution.state}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Category</span>
                    <span>{caseData.institution.institution_type}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No institution linked.</div>
            )}
          </div>
        </div>

        {/* Right Column: Tabbed Activity Workspace */}
        <div className="card-base" style={{ padding: "0", overflow: "hidden" }}>
          {/* Tab Bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border-subtle)",
              background: "rgba(15, 23, 42, 0.5)",
            }}
          >
            <button
              onClick={() => setActiveTab("timeline")}
              style={{
                flex: 1,
                padding: "0.85rem",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "timeline" ? "2px solid var(--accent-saffron)" : "2px solid transparent",
                color: activeTab === "timeline" ? "var(--accent-saffron)" : "var(--text-muted)",
                fontWeight: activeTab === "timeline" ? 700 : 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              <History size={16} /> Audit Timeline ({timeline.length})
            </button>

            <button
              onClick={() => setActiveTab("notes")}
              style={{
                flex: 1,
                padding: "0.85rem",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "notes" ? "2px solid var(--accent-saffron)" : "2px solid transparent",
                color: activeTab === "notes" ? "var(--accent-saffron)" : "var(--text-muted)",
                fontWeight: activeTab === "notes" ? 700 : 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              <FileText size={16} /> Internal Notes ({notes.length})
            </button>
          </div>

          {/* Tab 1: Timeline */}
          {activeTab === "timeline" && (
            <div style={{ padding: "1.25rem", maxHeight: "650px", overflowY: "auto" }}>
              <TimelineView events={timeline} />
            </div>
          )}

          {/* Tab 2: Internal Notes */}
          {activeTab === "notes" && (
            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Note Composer (Only for authorized non-auditors) */}
              {!isAuditor ? (
                <form
                  onSubmit={handleAddNote}
                  style={{
                    padding: "1rem",
                    background: "rgba(15, 23, 42, 0.5)",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    Add Internal Investigation Note
                  </div>

                  {noteError && (
                    <div style={{ color: "var(--risk-overdue)", fontSize: "0.8rem" }}>{noteError}</div>
                  )}

                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="Enter observation, telephonic follow-up, or internal memo..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    required
                  />

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isConfidential}
                        onChange={(e) => setIsConfidential(e.target.checked)}
                      />
                      <Lock size={12} /> Confidential Note (Hidden from external auditors)
                    </label>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmittingNote || !noteContent.trim()}
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      <Send size={13} /> {isSubmittingNote ? "Saving..." : "Record Note"}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ padding: "0.75rem", background: "rgba(100, 116, 139, 0.1)", borderRadius: "4px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Auditors have read-only access. Note composition is disabled.
                </div>
              )}

              {/* Notes List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "450px", overflowY: "auto" }}>
                {notes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No notes recorded on this case yet.
                  </div>
                ) : (
                  notes.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "0.85rem",
                        background: "var(--bg-input)",
                        borderRadius: "6px",
                        border: n.is_confidential
                          ? "1px solid rgba(245, 158, 11, 0.3)"
                          : "1px solid var(--border-subtle)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.4rem",
                          fontSize: "0.75rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <User size={13} color="var(--accent-saffron)" />
                          <strong style={{ color: "var(--text-primary)" }}>
                            {n.author?.full_name || "Case Officer"}
                          </strong>
                          {n.is_confidential && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                                padding: "0.1rem 0.35rem",
                                borderRadius: "4px",
                                background: "rgba(245, 158, 11, 0.15)",
                                color: "var(--risk-approaching)",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                              }}
                            >
                              <Lock size={10} /> Confidential
                            </span>
                          )}
                        </div>
                        <span style={{ color: "var(--text-muted)" }}>
                          {new Date(n.created_at).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                        {n.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transition Modal */}
      {isTransitionOpen && (
        <CaseTransitionModal
          currentCase={caseData}
          isOpen={isTransitionOpen}
          onClose={() => setIsTransitionOpen(false)}
          onSuccess={(updated) => {
            setCaseData(updated);
            loadCaseDetails();
          }}
        />
      )}

      {/* Reassignment Modal */}
      {isReassignOpen && (
        <CaseReassignmentModal
          currentCase={caseData}
          isOpen={isReassignOpen}
          onClose={() => setIsReassignOpen(false)}
          onSuccess={(updated) => {
            setCaseData(updated);
            loadCaseDetails();
          }}
        />
      )}
    </div>
  );
};
