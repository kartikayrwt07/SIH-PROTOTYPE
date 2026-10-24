import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRole } from "@/contexts/RoleContext";
import type { UserRole } from "@/types/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { changeRole, role } = useRole();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError("Enter your officer ID or registered email address.");
      return;
    }

    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate({ to: "/dashboard" });
    }, 400);
  };

  const handleQuickRole = (r: UserRole) => {
    changeRole(r);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-br from-[#FCFBFE] via-[#FAF8FD] to-[#F5F2FA] dark:from-[#05040A] dark:via-[#07050E] dark:to-[#0A0714]">
      <div className="w-full max-w-sm space-y-6">
        {/* Wordmark Above */}
        <div className="flex items-center justify-center gap-2.5 select-none">
          <span className="h-3 w-3 rounded-[3px] bg-[#7052C8] shrink-0 shadow-[0_0_8px_rgba(112,82,200,0.4)]" aria-hidden="true" />
          <span className="font-serif text-xl font-semibold text-ink tracking-tight">
            AICTE Case Monitor
          </span>
        </div>

        {/* Centered Form — Modern Frosted Glass Card with Subtle Glow */}
        <div className="bg-white/85 dark:bg-[#0B0813]/90 backdrop-blur-xl border border-[#ECE6F4] dark:border-[#201533] p-8 rounded-[12px] space-y-5 shadow-[0_8px_32px_rgba(112,82,200,0.06)]">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-ink">Sign in to your account</h2>
            <p className="text-xs text-text-secondary leading-normal">
              Enter your official credentials to access grievance case records.
            </p>
          </div>

          {error && (
            <div
              className="p-3 bg-sla-overdue-bg border border-[#ECE6F4] rounded-[6px] text-xs text-sla-overdue"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="text-xs font-medium text-ink block">
                Officer ID or email
              </label>
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="officer@aicte-india.org"
                className="h-9 text-xs bg-white/70 dark:bg-[#05040A] border-[#ECE6F4] dark:border-[#201533] text-ink dark:text-[#F2EEFA] rounded-[6px] focus:border-[#7052C8] dark:focus:border-[#9333EA] focus:ring-1 focus:ring-[#7052C8]/30 dark:focus:ring-[#9333EA]/30"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-ink block">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9 text-xs bg-white/70 dark:bg-[#05040A] border-[#ECE6F4] dark:border-[#201533] text-ink dark:text-[#F2EEFA] rounded-[6px] focus:border-[#7052C8] dark:focus:border-[#9333EA] focus:ring-1 focus:ring-[#7052C8]/30 dark:focus:ring-[#9333EA]/30"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 bg-[#7052C8] hover:bg-[#5E3EA8] text-white text-xs font-medium rounded-[6px] shadow-[0_2px_10px_rgba(112,82,200,0.25)] cursor-pointer transition-all"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-[#ECE6F4] dark:border-[#201533] space-y-2">
            <span className="text-[11px] text-text-muted block">
              Quick access demo roles:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickRole("ADMIN")}
                className="py-1.5 px-2 border border-[#ECE6F4] dark:border-[#201533] rounded-[6px] bg-white/60 dark:bg-[#05040A] hover:bg-white dark:hover:bg-[#120D20] hover:border-[#7052C8]/30 dark:hover:border-[#9333EA]/40 text-ink dark:text-[#F2EEFA] text-left text-[11px] cursor-pointer transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("SUPERVISOR")}
                className="py-1.5 px-2 border border-[#ECE6F4] dark:border-[#201533] rounded-[6px] bg-white/60 dark:bg-[#05040A] hover:bg-white dark:hover:bg-[#120D20] hover:border-[#7052C8]/30 dark:hover:border-[#9333EA]/40 text-ink dark:text-[#F2EEFA] text-left text-[11px] cursor-pointer transition-colors"
              >
                Supervisor
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("OFFICER")}
                className="py-1.5 px-2 border border-[#ECE6F4] dark:border-[#201533] rounded-[6px] bg-white/60 dark:bg-[#05040A] hover:bg-white dark:hover:bg-[#120D20] hover:border-[#7052C8]/30 dark:hover:border-[#9333EA]/40 text-ink dark:text-[#F2EEFA] text-left text-[11px] cursor-pointer transition-colors"
              >
                Officer (Approval)
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("AUDITOR")}
                className="py-1.5 px-2 border border-[#ECE6F4] dark:border-[#201533] rounded-[6px] bg-white/60 dark:bg-[#05040A] hover:bg-white dark:hover:bg-[#120D20] hover:border-[#7052C8]/30 dark:hover:border-[#9333EA]/40 text-ink dark:text-[#F2EEFA] text-left text-[11px] cursor-pointer transition-colors"
              >
                Auditor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
