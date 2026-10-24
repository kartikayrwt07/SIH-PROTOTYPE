/**
 * App shell — persistent layout wrapping all screens.
 * Sidebar on desktop, slide-out drawer on mobile.
 */

import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { RoleSwitcher } from "./RoleSwitcher";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { RoleProvider } from "@/contexts/RoleContext";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <RoleProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div
              className="absolute inset-y-0 left-0 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-card flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>

            <RoleSwitcher />
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <Toaster position="top-right" richColors />
    </RoleProvider>
  );
}
