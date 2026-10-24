import React from "react";
import { AlertCircle, Lock, Eye, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const RoleBanner: React.FC = () => {
  const { currentRole, currentUser } = useAuth();

  const getRoleBadge = () => {
    switch (currentRole) {
      case "ADMIN":
        return {
          label: "Platform Administrator",
          desc: "Unrestricted Cross-Bureau Access, Configuration, Ingestion, and User Management",
          color: "var(--accent-aicte-blue)",
          icon: CheckCircle2,
        };
      case "SUPERVISOR":
        return {
          label: "Central Supervisor",
          desc: "Full Cross-Bureau Case Oversight, Escalation Handling & Reassignments",
          color: "var(--accent-saffron)",
          icon: Eye,
        };
      case "OFFICER":
        return {
          label: "Bureau Case Officer",
          desc: `Scoped Jurisdiction: ${currentUser?.bureau_name || "Approval Bureau"} only. Cross-bureau access is blocked by server-side IDOR guard.`,
          color: "var(--status-assigned)",
          icon: Lock,
        };
      case "AUDITOR":
        return {
          label: "Read-Only Auditor",
          desc: "Read-Only Cross-Bureau Visibility. All sensitive complainant personal details & internal notes are server-redacted.",
          color: "var(--text-secondary)",
          icon: AlertCircle,
        };
      default:
        return {
          label: "Authenticated Officer",
          desc: "AICTE Portal Role-Enforced Session",
          color: "var(--accent-aicte-blue)",
          icon: CheckCircle2,
        };
    }
  };

  const badge = getRoleBadge();
  const Icon = badge.icon;

  return (
    <div
      style={{
        background: "rgba(18, 28, 56, 0.8)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "0.5rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.8rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <Icon size={16} color={badge.color} />
        <span style={{ color: "var(--text-secondary)" }}>
          Active Session: <strong style={{ color: badge.color }}>{badge.label}</strong> &bull; {badge.desc}
        </span>
      </div>

      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
        AICTE Role-Based Access Control &bull; Server Enforced
      </div>
    </div>
  );
};
