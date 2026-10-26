/**
 * Official Case Register Sidebar
 * Near-white, soothing frosted glass panel with modern purple accents.
 * 240px wide, collapsible to 64px icon rail.
 */

import { useState } from "react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderOpen,
  Timer,
  Sparkles,
  Upload,
  GitBranch,
  Layers,
  Award,
  Bot,
  Wand2,
  GraduationCap,
  PanelLeftClose,
  PanelLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard",      label: "Dashboard",       icon: LayoutDashboard },
  { to: "/cases",          label: "Case register",   icon: FolderOpen },
  { to: "/student",        label: "Student portal",  icon: GraduationCap },
  { to: "/sla-radar",      label: "SLA radar",       icon: Timer },
  { to: "/ai-triage",      label: "Smart triage",    icon: Sparkles },
  { to: "/master-tickets", label: "Master tickets",  icon: Layers },
  { to: "/institutions",   label: "Trust scores",    icon: Award },
  { to: "/telegram",       label: "Telegram bot",    icon: Bot },
  { to: "/magic-intake",   label: "Magic AI intake", icon: Wand2 },
  { to: "/ingest",         label: "CSV ingestion",   icon: Upload, permission: "cases:import" },
  { to: "/state-machine",  label: "State machine",   icon: GitBranch },
];

interface SidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const matchRoute = useMatchRoute();
  const { user } = useRole();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || user?.permissions.includes(item.permission),
  );

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white/95 dark:bg-[#07050E]/98 backdrop-blur-xl border-r border-[#ECE6F4] dark:border-[#201533] text-[var(--color-ink)] transition-[width] duration-200 select-none shadow-[2px_0_24px_rgba(112,82,200,0.03)]",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Brand Wordmark Header */}
      <div
        className={cn(
          "h-14 border-b border-[#ECE6F4]/80 dark:border-[#201533]/80 flex items-center px-4 shrink-0 bg-white/50 dark:bg-[#07050E]/70",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <Link
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 overflow-hidden"
          title="SUTRA - AICTE Grievance & Case Monitoring"
        >
          {/* Luminous Purple Brand Mark */}
          <span
            className="h-2.5 w-2.5 rounded-[2px] bg-[#7052C8] shrink-0 shadow-[0_0_8px_rgba(112,82,200,0.5)]"
            aria-hidden="true"
          />

          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider text-[var(--color-ink)] whitespace-nowrap">
                SUTRA
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-[#7052C8]/10 text-[#7052C8] dark:bg-[#9333EA]/20 dark:text-[#E9D5FF]">
                AICTE
              </span>
            </div>
          )}
        </Link>

        {/* Mobile drawer close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-text-secondary hover:text-ink hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => {
          const isActive = !!matchRoute({ to: item.to, fuzzy: item.to === "/cases" });
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center text-xs font-medium rounded-[8px] transition-all duration-150 min-h-[40px] md:min-h-0",
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5 md:py-2",
                isActive
                  ? "text-[#5A38A8] dark:text-[#E9D5FF] bg-[#7052C8]/10 dark:bg-[#9333EA]/20 font-semibold border border-[#7052C8]/15 dark:border-[#9333EA]/35 shadow-[0_2px_8px_rgba(112,82,200,0.06)] dark:shadow-[0_0_12px_rgba(147,51,234,0.18)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r before:bg-[#7052C8]"
                  : "text-[var(--color-text-secondary)] dark:text-[#A396BE] hover:text-[var(--color-ink)] dark:hover:text-[#F2EEFA] hover:bg-[#7052C8]/5 dark:hover:bg-[#9333EA]/12 border border-transparent",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-[#7052C8] dark:text-[#C084FC]" : "text-[var(--color-text-muted)]",
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Rail / Collapse Toggle or Mobile Theme Info */}
      <div className="p-3 border-t border-[#ECE6F4]/80 dark:border-[#201533]/80 flex items-center justify-between text-xs text-[var(--color-text-muted)] dark:text-[#6E6185] bg-white/40 dark:bg-[#07050E]/60">
        {onClose ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-text-muted truncate">
              {user ? user.role : "SUTRA Portal"}
            </span>
            <ThemeToggle />
          </div>
        ) : (
          <>
            {!collapsed && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--color-text-secondary)] dark:text-[#9B91AF] hover:text-[var(--color-ink)] dark:hover:text-[#EDE8F5] hover:bg-[#7052C8]/6 dark:hover:bg-[#9333EA]/15 rounded-[6px] w-full cursor-pointer transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </button>
            )}

            {collapsed && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex items-center justify-center p-2 text-[var(--color-text-secondary)] dark:text-[#9B91AF] hover:text-[var(--color-ink)] dark:hover:text-[#EDE8F5] hover:bg-[#7052C8]/6 dark:hover:bg-[#9333EA]/15 rounded-[6px] w-full cursor-pointer transition-colors"
                title="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4 shrink-0" />
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
