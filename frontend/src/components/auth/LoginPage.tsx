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

  const fillQuickCredential = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword("Admin@123");
    setError(null);
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

        {/* Quick Accounts selector */}
        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
            Standard AICTE Officer Accounts (Password: <code>Admin@123</code>):
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => fillQuickCredential("admin@aicte-demo.gov.in")}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                padding: "0.45rem 0.6rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <strong style={{ color: "var(--accent-saffron)" }}>Platform Admin</strong>
              <span>admin@aicte-demo.gov.in</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickCredential("supervisor@aicte-demo.gov.in")}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                padding: "0.45rem 0.6rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <strong style={{ color: "var(--accent-aicte-blue)" }}>Central Supervisor</strong>
              <span>supervisor@aicte-demo.gov.in</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickCredential("officer.appr@aicte-demo.gov.in")}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                padding: "0.45rem 0.6rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <strong style={{ color: "var(--status-assigned)" }}>Approval Officer</strong>
              <span>officer.appr@aicte-demo.gov.in</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickCredential("auditor@aicte-demo.gov.in")}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                padding: "0.45rem 0.6rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>Read-Only Auditor</strong>
              <span>auditor@aicte-demo.gov.in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
