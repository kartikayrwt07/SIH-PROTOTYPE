import React from "react";
import { LayoutDashboard, FileSpreadsheet, Wand2, Sparkles, AlertTriangle, UploadCloud, Shield } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: "dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
    { id: "cases", label: "Case Register", icon: FileSpreadsheet },
    { id: "magic_intake", label: "Magic Intake (AI)", icon: Wand2 },
    { id: "smart_triage", label: "Smart Triage & AI", icon: Sparkles },
    { id: "sla_radar", label: "SLA Risk Radar", icon: AlertTriangle },
    { id: "ingest", label: "CSV Ingestion", icon: UploadCloud },
    { id: "rbac", label: "Access & Governance", icon: Shield },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">AI</div>
        <div className="sidebar-brand">
          <h1>AICTE Case Monitor</h1>
          <span>Cross-Bureau Grievance</span>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        <ul className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => onTabChange(item.id)}
                  style={{ width: "100%", textAlign: "left", background: isActive ? undefined : "transparent" }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
          <Shield size={14} color="#10B981" />
          <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600 }}>TLS 1.3 • ISO 27001</span>
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Enterprise Release v2.4</div>
      </div>
    </aside>
  );
};
