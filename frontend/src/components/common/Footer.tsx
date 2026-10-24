import React from "react";
import { Shield, Phone, Mail, CheckCircle2, Lock, ExternalLink, Globe } from "lucide-react";

interface FooterProps {
  systemStatus?: string;
}

export const Footer: React.FC<FooterProps> = ({ systemStatus = "Operational" }) => {
  return (
    <footer
      style={{
        marginTop: "3rem",
        background: "linear-gradient(180deg, rgba(14, 22, 45, 0.95) 0%, rgba(10, 16, 32, 0.98) 100%)",
        borderTop: "1px solid var(--border-subtle)",
        color: "var(--text-secondary)",
        fontSize: "0.82rem",
        borderRadius: "16px 16px 0 0",
        padding: "2.5rem 2rem 1.5rem",
        boxShadow: "0 -10px 25px -5px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "2.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Column 1: Organization & Emblem */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #F97316 0%, #2563EB 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "1rem",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              }}
            >
              AI
            </div>
            <div>
              <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
                AICTE Grievance Portal
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--accent-saffron-light)" }}>
                Ministry of Education, Govt. of India
              </div>
            </div>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: 1.6, marginBottom: "1rem" }}>
            Centralized Grievance Redressal, Dynamic SLA Surveillance & Explainable AI Triage
            for AICTE-approved Technical & Management Institutions nationwide.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "999px", padding: "0.25rem 0.75rem" }}>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 8px #10B981",
              }}
            />
            <span style={{ fontSize: "0.72rem", color: "#34D399", fontWeight: 600 }}>
              National Gateway: {systemStatus}
            </span>
          </div>
        </div>

        {/* Column 2: Governance & Statutory Bureaus */}
        <div>
          <div style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
            Statutory Jurisdictions
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.78rem" }}>
            <li style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>APPR:</strong> Approval Bureau (Norms & Infrastructure)
            </li>
            <li style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>FIN:</strong> Finance & Fee Regulatory Cell
            </li>
            <li style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>STU:</strong> Student Welfare & Anti-Ragging Cell
            </li>
            <li style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>FDC:</strong> Faculty Grievance & Development Cell
            </li>
          </ul>
        </div>

        {/* Column 3: National Helpdesk & Assistance */}
        <div>
          <div style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
            Central Helpdesk & Redressal
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Phone size={15} color="var(--accent-saffron)" />
              <span>National Toll-Free: <strong style={{ color: "#FFFFFF" }}>1800-11-2026</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Mail size={15} color="var(--accent-aicte-blue)" />
              <span>Official Support: <strong style={{ color: "#FFFFFF" }}>grievance@aicte-india.org</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Globe size={15} color="#10B981" />
              <span>Hours: <strong style={{ color: "#FFFFFF" }}>Mon - Fri (09:30 - 17:30 IST)</strong></span>
            </div>
          </div>
        </div>

        {/* Column 4: Standards, Cryptography & Compliance */}
        <div>
          <div style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
            Security & Certifications
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.76rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={14} color="#10B981" />
              <span>ISO 27001 Certified Information Security</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Lock size={14} color="var(--accent-aicte-blue)" />
              <span>256-Bit TLS End-to-End Encryption</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={14} color="var(--accent-saffron)" />
              <span>Role-Based Access Control (RBAC) • Strict IDOR Protection</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={14} color="#10B981" />
              <span>Tamper-Evident SHA-256 Audit Trail Logging</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          paddingTop: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
        }}
      >
        <div>
          &copy; {new Date().getFullYear()} All India Council for Technical Education (AICTE), Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070. All rights reserved.
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          <a
            href="https://www.aicte-india.org"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--text-secondary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            <span>AICTE Official Portal</span>
            <ExternalLink size={12} />
          </a>
          <span>&bull;</span>
          <span style={{ cursor: "pointer" }}>Citizen Charter</span>
          <span>&bull;</span>
          <span style={{ cursor: "pointer" }}>RTI Disclosure</span>
          <span>&bull;</span>
          <span style={{ cursor: "pointer" }}>Privacy Policy</span>
          <span>&bull;</span>
          <span style={{ cursor: "pointer" }}>Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};
