/**
 * App shell — official case register layout.
 * Ruled, calm, dense structure.
 * Ink sidebar on left, surface top bar with breadcrumbs and role switcher.
 */

import { useState } from "react";
import { Outlet, useLocation, Link } from "@tanstack/react-router";
import { Menu, X, ChevronRight } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { RoleSwitcher } from "./RoleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { CursorSpotlight } from "./CursorSpotlight";
import { MobileBottomBar } from "./MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { RoleProvider } from "@/contexts/RoleContext";

function Breadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  const parts: { label: string; to?: string }[] = [];

  if (path === "/dashboard" || path === "/") {
    parts.push({ label: "Dashboard" });
  } else if (path === "/cases") {
    parts.push({ label: "Case register" });
  } else if (path.startsWith("/cases/")) {
    const caseId = path.replace("/cases/", "");
    parts.push({ label: "Case register", to: "/cases" });
    parts.push({ label: caseId });
  } else if (path === "/sla-radar") {
    parts.push({ label: "SLA radar" });
  } else if (path === "/ai-triage") {
    parts.push({ label: "Smart triage" });
  } else if (path === "/ingest") {
    parts.push({ label: "CSV ingestion" });
  } else if (path === "/master-tickets") {
    parts.push({ label: "Master tickets" });
  } else if (path === "/institutions") {
    parts.push({ label: "Trust scores" });
  } else if (path === "/telegram") {
    parts.push({ label: "Telegram bot" });
  } else if (path === "/magic-intake") {
    parts.push({ label: "Magic AI intake" });
  } else if (path === "/state-machine") {
    parts.push({ label: "State machine" });
  } else if (path === "/login") {
    parts.push({ label: "Sign in" });
  } else {
    parts.push({ label: "SUTRA" });
  }

  const currentTitle = parts[parts.length - 1]?.label ?? "SUTRA";

  return (
    <>
      {/* Mobile Current Title */}
      <div className="flex sm:hidden items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#7052C8] dark:bg-[#9333EA] shadow-[0_0_8px_rgba(147,51,234,0.6)]" />
        <span className="text-xs font-semibold text-ink truncate max-w-[130px]">{currentTitle}</span>
      </div>

      {/* Desktop Breadcrumbs */}
      <nav className="hidden sm:flex items-center gap-1.5 text-xs text-text-secondary select-none" aria-label="Breadcrumb">
        {parts.map((p, idx) => {
          const isLast = idx === parts.length - 1;
          return (
            <span key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="h-3 w-3 text-rule shrink-0" aria-hidden="true" />}
              {p.to && !isLast ? (
                <Link to={p.to} className="hover:text-ink transition-none">
                  {p.label}
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-ink" : ""}>{p.label}</span>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <RoleProvider>
      <div className="flex h-screen bg-gradient-to-br from-[#FCFBFE] via-[#FAF8FD] to-[#F5F2FA] dark:from-[#05040A] dark:via-[#07050E] dark:to-[#0A0714] text-ink overflow-hidden relative">
        <CursorSpotlight />
        {/* Desktop sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
        </div>

        {/* Mobile sidebar overlay drawer */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200" />
            <div
              className="absolute inset-y-0 left-0 z-50 w-68 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-250 ease-out"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Top bar: Frosted glass header with subtle ambient glow */}
          <header className="flex items-center justify-between h-12 px-3 sm:px-6 lg:px-8 border-b border-[#ECE6F4] dark:border-[#201533] bg-white/80 dark:bg-[#07050E]/90 dark:border-[#201533] backdrop-blur-md shadow-[0_1px_12px_rgba(112,82,200,0.02)] shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 text-text-secondary hover:text-ink shrink-0"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>

              <Breadcrumbs />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <ThemeToggle />
              <RoleSwitcher />
            </div>
          </header>

          {/* Page content with bottom space on mobile for navigation bar */}
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            <Outlet />
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomBar
          onOpenMenu={() => setMobileOpen(true)}
          isMenuOpen={mobileOpen}
        />
      </div>

      <Toaster position="top-right" richColors />
    </RoleProvider>
  );
}
