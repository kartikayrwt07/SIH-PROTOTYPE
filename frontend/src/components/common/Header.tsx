import React from "react";
import { ShieldCheck, UserCheck } from "lucide-react";
import { UserRole } from "../../types";

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  serviceStatus: string;
}

export const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange, serviceStatus }) => {
  return (
    <header className="top-header">
      <div className="header-title-section">
        <span className="disclaimer-pill">Prototype Demonstration</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          <ShieldCheck size={16} color="var(--risk-normal)" />
          <span>System: <strong style={{ color: "var(--text-primary)" }}>{serviceStatus}</strong></span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        {/* Interactive Demo Role-Switcher */}
        <div className="role-switcher-widget">
          <UserCheck size={15} color="var(--accent-saffron)" />
          <label htmlFor="role-select">Demo Role:</label>
          <select
            id="role-select"
            className="role-select"
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
          >
            <option value="ADMIN">Platform Administrator</option>
            <option value="SUPERVISOR">Central Supervisor</option>
            <option value="OFFICER">Bureau Case Officer (APPR)</option>
            <option value="AUDITOR">Read-Only Auditor</option>
          </select>
        </div>
      </div>
    </header>
  );
};
