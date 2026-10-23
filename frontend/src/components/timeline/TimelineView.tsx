import React from "react";
import { TimelineEvent } from "../../types";
import { CheckCircle2, Clock, ArrowRight, User, RefreshCw, Lock, FileText } from "lucide-react";

interface TimelineViewProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events, isLoading = false }) => {
  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Loading chronological case activity...
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        No audit events recorded for this case yet.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "REGISTERED":
        return <CheckCircle2 size={16} color="var(--accent-aicte-blue)" />;
      case "STATUS_CHANGE":
        return <ArrowRight size={16} color="var(--accent-saffron)" />;
      case "RESOLVED":
        return <CheckCircle2 size={16} color="var(--risk-normal)" />;
      case "CLOSED":
        return <Lock size={16} color="var(--text-muted)" />;
      case "REOPENED":
        return <RefreshCw size={16} color="var(--risk-overdue)" />;
      case "NOTE_ADDED":
        return <FileText size={16} color="var(--status-assigned)" />;
      default:
        return <Clock size={16} color="var(--text-secondary)" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
      {/* Vertical connection line */}
      <div
        style={{
          position: "absolute",
          left: "7px",
          top: "10px",
          bottom: "10px",
          width: "2px",
          backgroundColor: "var(--border-subtle)",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {events.map((evt) => (
          <div key={evt.id} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {/* Timeline bullet dot */}
            <div
              style={{
                position: "absolute",
                left: "-1.5rem",
                top: "2px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: "var(--bg-card)",
                border: "2px solid var(--border-active)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {getEventIcon(evt.event_type)}
                <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{evt.event_type}</strong>
                {evt.previous_state && evt.new_state && (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--text-muted)" }}>{evt.previous_state}</span> &rarr;{" "}
                    <strong style={{ color: "var(--accent-saffron-light)" }}>{evt.new_state}</strong>
                  </span>
                )}
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {formatTimestamp(evt.timestamp)}
              </span>
            </div>

            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <User size={13} />
                <span>{evt.actor_name || "System Automated"}</span>
                <span className="badge badge-low" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                  {evt.actor_role}
                </span>
              </div>

              {evt.metadata_json?.remarks && (
                <div style={{ color: "var(--text-primary)", fontStyle: "italic", marginTop: "0.25rem" }}>
                  &ldquo;{evt.metadata_json.remarks}&rdquo;
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
