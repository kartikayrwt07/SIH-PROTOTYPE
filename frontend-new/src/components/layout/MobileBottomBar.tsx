import React from "react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderOpen,
  Timer,
  Sparkles,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomBarProps {
  onOpenMenu: () => void;
  isMenuOpen: boolean;
}

export function MobileBottomBar({ onOpenMenu, isMenuOpen }: MobileBottomBarProps) {
  const matchRoute = useMatchRoute();

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/cases", label: "Cases", icon: FolderOpen },
    { to: "/sla-radar", label: "Radar", icon: Timer },
    { to: "/ai-triage", label: "Triage", icon: Sparkles },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white/92 dark:bg-[#07050E]/96 backdrop-blur-xl border-t border-[#ECE6F4] dark:border-[#201533] px-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] select-none safe-area-pb"
    >
      {navItems.map((item) => {
        const isActive = !isMenuOpen && !!matchRoute({ to: item.to, fuzzy: item.to === "/cases" });
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-all duration-150 rounded-lg",
              isActive
                ? "text-[#7052C8] dark:text-[#C084FC] font-semibold"
                : "text-[var(--color-text-muted)] dark:text-[#8E82A8] hover:text-[var(--color-ink)]",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-8 h-7 rounded-md transition-all duration-150",
                isActive
                  ? "bg-[#7052C8]/15 dark:bg-[#9333EA]/25 shadow-xs"
                  : "bg-transparent",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "stroke-[2.2]" : "stroke-[1.8]")} />
            </div>
            <span className="truncate mt-0.5">{item.label}</span>
          </Link>
        );
      })}

      {/* Menu / Drawer Trigger */}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Toggle navigation drawer"
        className={cn(
          "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-all duration-150 rounded-lg cursor-pointer",
          isMenuOpen
            ? "text-[#7052C8] dark:text-[#C084FC] font-semibold"
            : "text-[var(--color-text-muted)] dark:text-[#8E82A8] hover:text-[var(--color-ink)]",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center w-8 h-7 rounded-md transition-all duration-150",
            isMenuOpen
              ? "bg-[#7052C8]/15 dark:bg-[#9333EA]/25 shadow-xs"
              : "bg-transparent",
          )}
        >
          <Menu className={cn("h-4 w-4", isMenuOpen ? "stroke-[2.2]" : "stroke-[1.8]")} />
        </div>
        <span className="truncate mt-0.5">Menu</span>
      </button>
    </nav>
  );
}
