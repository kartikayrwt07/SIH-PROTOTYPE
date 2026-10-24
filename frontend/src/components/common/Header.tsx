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

        {/* Quick Role Switcher for Evaluation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(18, 28, 56, 0.8)",
            border: "1px solid var(--border-subtle)",
            padding: "0.25rem 0.6rem",
            borderRadius: "8px",
            fontSize: "0.8rem",
          }}
        >
          <UserCheck size={14} color="var(--accent-saffron)" />
          <label htmlFor="quick-role-select" style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600 }}>
            Switch:
          </label>
          <select
            id="quick-role-select"
            className="role-select"
            value={currentRole}
            onChange={(e) => switchRole(e.target.value as any)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "0.78rem",
              fontWeight: 600,
              padding: "0.15rem 0.3rem",
              cursor: "pointer",
            }}
          >
            <option value="ADMIN">Platform Admin</option>
            <option value="SUPERVISOR">Central Supervisor</option>
            <option value="OFFICER">Approval Officer</option>
            <option value="AUDITOR">Read-Only Auditor</option>
          </select>
        </div>

        {/* Real Logout Action */}
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
            padding: "0.45rem 0.8rem",
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
