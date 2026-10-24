import React, { useState } from "react";
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface LoginModalProps {
  isOpen?: boolean;
}

export const LoginPage: React.FC<LoginModalProps> = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email.trim(), password);
      if (!res.success) {
        setError(res.error?.message || "Invalid credentials. Please verify your official AICTE email and password.");
      }
    } catch (err: any) {
      setError(err?.message || "Authentication service failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword("Admin@123");
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(quickEmail, "Admin@123");
      if (!res.success) {
        setError(res.error?.message || "Invalid credentials. Please verify your official AICTE email and password.");
      }
    } catch (err: any) {
      setError(err?.message || "Authentication service failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at top, #1E293B 0%, #0B132B 70%)",
        padding: "1.5rem",
      }}
    >
      <div
        className="card-base"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "2.5rem 2rem",
          background: "rgba(18, 28, 56, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
          borderRadius: "16px",
        }}
      >
        {/* Emblem & Title */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #F97316 0%, #2563EB 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.4)",
            }}
          >
            <Shield size={32} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#F8FAFC", marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>
            AICTE Portal Login
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            Central Grievance Monitoring & Institutional Case Surveillance
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid var(--risk-overdue)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.85rem",
              color: "#FCA5A5",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
              Official Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={18}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@aicte.gov.in"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  background: "rgba(11, 19, 43, 0.8)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: "100%",
                  padding: "0.75rem 2.5rem 0.75rem 2.5rem",
                  background: "rgba(11, 19, 43, 0.8)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: "0.5rem",
              padding: "0.85rem",
              background: "linear-gradient(135deg, var(--accent-aicte-blue) 0%, #1D4ED8 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              transition: "all 0.2s ease",
            }}
          >
            {isLoading ? "Authenticating..." : <>Sign In to Dashboard <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* Authorized Departmental Personas for Testing & Auditing */}
        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
              Authorized Departmental Personas
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--accent-saffron-light)", fontWeight: 600 }}>
              Evaluator Quick-Access
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("admin@aicte-demo.gov.in")}
              title="Sign in as Platform Administrator"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "0.65rem 0.75rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
                textAlign: "left",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-saffron)";
                e.currentTarget.style.background = "rgba(249, 115, 22, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <strong style={{ color: "var(--accent-saffron)", fontSize: "0.78rem" }}>Platform Admin</strong>
                <span style={{ fontSize: "0.65rem", background: "rgba(249, 115, 22, 0.15)", color: "var(--accent-saffron)", padding: "0.1rem 0.35rem", borderRadius: "4px" }}>ALL</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>admin@aicte-demo.gov.in</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("supervisor@aicte-demo.gov.in")}
              title="Sign in as Central Supervisor"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "0.65rem 0.75rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
                textAlign: "left",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-aicte-blue)";
                e.currentTarget.style.background = "rgba(37, 99, 235, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <strong style={{ color: "var(--accent-aicte-blue)", fontSize: "0.78rem" }}>Supervisor</strong>
                <span style={{ fontSize: "0.65rem", background: "rgba(37, 99, 235, 0.15)", color: "var(--accent-aicte-blue)", padding: "0.1rem 0.35rem", borderRadius: "4px" }}>ESCALATE</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>supervisor@aicte-demo.gov.in</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("officer.appr@aicte-demo.gov.in")}
              title="Sign in as Approval Bureau Officer"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "0.65rem 0.75rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
                textAlign: "left",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--status-assigned)";
                e.currentTarget.style.background = "rgba(6, 182, 212, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <strong style={{ color: "var(--status-assigned)", fontSize: "0.78rem" }}>Case Officer</strong>
                <span style={{ fontSize: "0.65rem", background: "rgba(6, 182, 212, 0.15)", color: "var(--status-assigned)", padding: "0.1rem 0.35rem", borderRadius: "4px" }}>APPR</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>officer.appr@aicte-demo.gov.in</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("auditor@aicte-demo.gov.in")}
              title="Sign in as Read-Only Auditor"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "0.65rem 0.75rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
                textAlign: "left",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#94A3B8";
                e.currentTarget.style.background = "rgba(148, 163, 184, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <strong style={{ color: "var(--text-primary)", fontSize: "0.78rem" }}>Auditor</strong>
                <span style={{ fontSize: "0.65rem", background: "rgba(148, 163, 184, 0.15)", color: "#94A3B8", padding: "0.1rem 0.35rem", borderRadius: "4px" }}>REDACTED</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>auditor@aicte-demo.gov.in</span>
            </button>
          </div>

          {/* Security Compliance Footer in Card */}
          <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
            <span>TLS 1.3 Encryption</span>
            <span>&bull;</span>
            <span>ISO 27001 Certified</span>
            <span>&bull;</span>
            <span>NIC e-Gov Guidelines</span>
          </div>
        </div>
      </div>
    </div>
  );
};
