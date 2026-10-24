/**
 * Sidebar navigation — links to all 7 screens.
 */

import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderOpen,
  Timer,
  Sparkles,
  Upload,
  GitBranch,
  ShieldAlert,
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
  { to: "/cases",         label: "Case Register",  icon: FolderOpen },
  { to: "/sla-radar",     label: "SLA Radar",      icon: Timer },
  { to: "/ai-triage",     label: "Smart Triage",   icon: Sparkles },
  { to: "/ingest",        label: "CSV Ingestion",  icon: Upload,   permission: "cases:import" },
  { to: "/state-machine", label: "State Machine",  icon: GitBranch },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const matchRoute = useMatchRoute();
  const { user } = useRole();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || user?.permissions.includes(item.permission),
  );

  return (
    <aside className="flex flex-col h-full bg-card border-r border-border/50 w-56">
      {/* Wordmark */}
      <div className="px-4 py-3.5 border-b border-border/50">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight text-foreground">
              AICTE · Case Monitor
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">Grievance Portal</div>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = !!matchRoute({ to: item.to, fuzzy: item.to === "/cases" });
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-80" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground/70">
          {(import.meta.env.VITE_USE_MOCKS as string | undefined)?.toLowerCase() !== "false"
            ? "Mock environment"
            : "Live API"}
        </p>
      </div>
    </aside>
  );
}
