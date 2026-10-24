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
    <div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center py-12 px-4 bg-page">
      <div className="w-full max-w-sm space-y-6">
        {/* Wordmark Above */}
        <div className="flex items-center justify-center gap-2 select-none">
          <span className="h-3 w-3 rounded-[1px] bg-saffron shrink-0" aria-hidden="true" />
          <span className="font-serif text-xl font-semibold text-ink tracking-tight">
            AICTE Case Monitor
          </span>
        </div>

        {/* Centered Form — Ruled, No Card Shadow */}
        <div className="bg-surface border border-rule p-8 rounded-lg space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-ink">Sign in to your account</h2>
            <p className="text-xs text-text-secondary leading-normal">
              Enter your official credentials to access grievance case records.
            </p>
          </div>

          {error && (
            <div
              className="p-3 bg-sla-overdue-bg border border-rule rounded text-xs text-sla-overdue"
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
                className="h-9 text-xs bg-surface border-rule rounded-md focus:border-action"
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
                className="h-9 text-xs bg-surface border-rule rounded-md focus:border-action"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 bg-action text-white hover:bg-action/90 text-xs font-medium rounded-md shadow-none cursor-pointer"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-rule space-y-2">
            <span className="text-[11px] text-text-muted block">
              Quick access demo roles:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickRole("ADMIN")}
                className="py-1.5 px-2 border border-rule rounded bg-page hover:bg-surface text-ink text-left text-[11px] cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("SUPERVISOR")}
                className="py-1.5 px-2 border border-rule rounded bg-page hover:bg-surface text-ink text-left text-[11px] cursor-pointer"
              >
                Supervisor
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("OFFICER")}
                className="py-1.5 px-2 border border-rule rounded bg-page hover:bg-surface text-ink text-left text-[11px] cursor-pointer"
              >
                Officer (Approval)
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("AUDITOR")}
                className="py-1.5 px-2 border border-rule rounded bg-page hover:bg-surface text-ink text-left text-[11px] cursor-pointer"
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
