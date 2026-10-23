import React from "react";
import { LayoutDashboard, FileSpreadsheet, Sparkles, AlertTriangle, UploadCloud, Shield, HelpCircle } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: "dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
    { id: "cases", label: "Case Register", icon: FileSpreadsheet },
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <HelpCircle size={14} color="var(--text-muted)" />
          <span>SIH 2026 Prototype</span>
        </div>
        <div>Configurable Policy Schema v1.0</div>
      </div>
    </aside>
  );
};
