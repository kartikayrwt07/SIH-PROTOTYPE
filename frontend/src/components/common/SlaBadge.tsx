import React from "react";
import { Clock, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { CaseStatus } from "../../types";

interface SlaBadgeProps {
  dueDate?: string;
  status: CaseStatus;
  escalationLevel?: number;
  compact?: boolean;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({
  dueDate,
  status,
  compact = false,
}) => {
  if (status === "Rejected") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: compact ? "0.15rem 0.4rem" : "0.25rem 0.6rem",
          borderRadius: "4px",
          fontSize: compact ? "0.75rem" : "0.8rem",
          fontWeight: 600,
          background: "rgba(239, 68, 68, 0.12)",
          color: "#EF4444",
          border: "1px solid rgba(239, 68, 68, 0.25)",
        }}
        title="Grievance rejected as malformed, spam, or out-of-jurisdiction"
      >
        <AlertCircle size={compact ? 12 : 14} />
        {!compact && "Rejected / Spam"}
      </span>
    );
  }

  if (status === "Resolved" || status === "Closed") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: compact ? "0.15rem 0.4rem" : "0.25rem 0.6rem",
          borderRadius: "4px",
          fontSize: compact ? "0.75rem" : "0.8rem",
          fontWeight: 600,
          background: "rgba(16, 185, 129, 0.12)",
          color: "var(--risk-normal)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
        }}
        title="Case resolution completed"
      >
        <CheckCircle2 size={compact ? 12 : 14} />
        {!compact && "Met / Completed"}
      </span>
    );
  }

  if (!dueDate) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: compact ? "0.15rem 0.4rem" : "0.25rem 0.6rem",
          borderRadius: "4px",
          fontSize: compact ? "0.75rem" : "0.8rem",
          fontWeight: 500,
          background: "rgba(148, 163, 184, 0.1)",
          color: "var(--text-muted)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        No SLA Target
      </span>
    );
  }

  const now = new Date();
  const target = new Date(dueDate);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(Math.abs(diffHours) / 24);
  const remHours = Math.abs(diffHours) % 24;

  const formattedDate = target.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffMs < 0) {
    // Overdue / Breached
    const overdueText =
      diffDays > 0 ? `${diffDays}d ${remHours}h overdue` : `${remHours}h overdue`;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: compact ? "0.15rem 0.4rem" : "0.25rem 0.65rem",
          borderRadius: "4px",
          fontSize: compact ? "0.75rem" : "0.8rem",
          fontWeight: 700,
          background: "rgba(239, 68, 68, 0.15)",
          color: "var(--risk-overdue)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
        }}
        title={`Target deadline was ${formattedDate}`}
        aria-label={`Overdue SLA target: ${overdueText}`}
      >
        <AlertCircle size={compact ? 12 : 14} />
        {compact ? "Overdue" : overdueText}
      </span>
    );
  }

  if (diffHours <= 48) {
    // Approaching Deadline
    const timeText = diffHours <= 1 ? "< 1h left" : `${diffHours}h left`;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: compact ? "0.15rem 0.4rem" : "0.25rem 0.65rem",
          borderRadius: "4px",
          fontSize: compact ? "0.75rem" : "0.8rem",
          fontWeight: 700,
          background: "rgba(245, 158, 11, 0.15)",
          color: "var(--risk-approaching)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
        }}
        title={`Target deadline: ${formattedDate}`}
        aria-label={`Approaching SLA target: ${timeText}`}
      >
        <AlertTriangle size={compact ? 12 : 14} />
        {compact ? "Approaching" : timeText}
      </span>
    );
  }

  // On track
  const trackText = diffDays > 0 ? `${diffDays}d remaining` : `${diffHours}h remaining`;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: compact ? "0.15rem 0.4rem" : "0.25rem 0.65rem",
        borderRadius: "4px",
        fontSize: compact ? "0.75rem" : "0.8rem",
        fontWeight: 600,
        background: "rgba(16, 185, 129, 0.12)",
        color: "var(--risk-normal)",
        border: "1px solid rgba(16, 185, 129, 0.25)",
      }}
      title={`Target deadline: ${formattedDate}`}
      aria-label={`SLA on track: ${trackText}`}
    >
      <Clock size={compact ? 12 : 14} />
      {compact ? "On Track" : trackText}
    </span>
  );
};
