/**
 * Official Case Register Sidebar
 * Ink background (#12203A), 240px wide, collapsible to 64px icon rail.
 * Wordmark "AICTE Case Monitor" with saffron square mark.
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
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { to: "/cases",         label: "Case register",  icon: FolderOpen },
  { to: "/sla-radar",     label: "SLA radar",      icon: Timer },
  { to: "/ai-triage",     label: "Smart triage",   icon: Sparkles },
  { to: "/ingest",        label: "CSV ingestion",  icon: Upload, permission: "cases:import" },
  { to: "/state-machine", label: "State machine",  icon: GitBranch },
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
        "flex flex-col h-full bg-ink text-white transition-[width] duration-150 select-none",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Brand Wordmark Header */}
      <div
        className={cn(
          "h-12 border-b border-white/10 flex items-center px-4 shrink-0",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <Link
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 overflow-hidden"
          title="AICTE Case Monitor"
        >
          {/* Saffron Brand Mark */}
          <span className="h-2.5 w-2.5 rounded-[1px] bg-saffron shrink-0" aria-hidden="true" />

          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight text-white whitespace-nowrap">
              AICTE Case Monitor
            </span>
          )}
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
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
                "relative flex items-center text-sm font-medium transition-none",
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-4 py-2",
                isActive
                  ? "text-white bg-white/10 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-saffron"
                  : "text-white/70 hover:text-white hover:bg-white/5",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Rail / Collapse Toggle */}
      <div className="p-2 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
        {!collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded w-full cursor-pointer"
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
            className="flex items-center justify-center p-2 text-white/60 hover:text-white hover:bg-white/5 rounded w-full cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4 shrink-0" />
          </button>
        )}
      </div>
    </aside>
  );
}
