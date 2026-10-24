import React from "react";
import { ShieldCheck, LogOut, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  serviceStatus: string;
}

export const Header: React.FC<HeaderProps> = ({ serviceStatus }) => {
  const { currentUser, currentRole, switchRole, logout } = useAuth();

  return (
    <header className="top-header">
      <div className="header-title-section">
        <span
          style={{
            background: "rgba(37, 99, 235, 0.15)",
            border: "1px solid rgba(37, 99, 235, 0.4)",
            color: "#60A5FA",
            fontSize: "0.72rem",
            fontWeight: 700,
            padding: "0.25rem 0.6rem",
            borderRadius: "999px",
            letterSpacing: "0.03em",
          }}
        >
          AICTE Grievance Portal
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          <ShieldCheck size={16} color="var(--risk-normal)" />
          <span>System: <strong style={{ color: "var(--text-primary)" }}>{serviceStatus}</strong></span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        {/* Authenticated User Profile Pill */}
        {currentUser && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              background: "rgba(18, 28, 56, 0.8)",
              border: "1px solid var(--border-subtle)",
              padding: "0.35rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.8rem",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent-aicte-blue), var(--accent-saffron))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "#FFFFFF",
                fontSize: "0.75rem",
              }}
            >
              {currentUser.full_name?.charAt(0) || "U"}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>
                {currentUser.full_name}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--accent-saffron-light)", lineHeight: 1.1 }}>
                {currentUser.role} {currentUser.bureau_code ? `(${currentUser.bureau_code})` : ""}
              </span>
            </div>
          </div>
        )}

        {/* Evaluator Role Persona Simulator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(18, 28, 56, 0.9)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            padding: "0.3rem 0.75rem",
            borderRadius: "8px",
            fontSize: "0.78rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <UserCheck size={14} color="var(--accent-saffron)" />
            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Persona:
            </span>
          </div>
          <select
            id="quick-role-select"
            className="role-select"
            value={currentRole}
            onChange={(e) => switchRole(e.target.value as any)}
            style={{
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              fontSize: "0.78rem",
              fontWeight: 700,
              padding: "0.15rem 0.2rem",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="ADMIN" style={{ background: "#121C38", color: "#FFFFFF" }}>Platform Administrator</option>
            <option value="SUPERVISOR" style={{ background: "#121C38", color: "#FFFFFF" }}>Central Supervisor</option>
            <option value="OFFICER" style={{ background: "#121C38", color: "#FFFFFF" }}>Approval Bureau Officer (APPR)</option>
            <option value="AUDITOR" style={{ background: "#121C38", color: "#FFFFFF" }}>Read-Only Auditor</option>
          </select>
        </div>

        {/* Official Sign Out Action */}
        <button
          onClick={logout}
          title="Sign out of AICTE Portal"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#FCA5A5",
            borderRadius: "8px",
            padding: "0.45rem 0.85rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)")}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
