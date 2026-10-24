import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className={`h-8 w-8 px-0 rounded-lg border-[#ECE6F4] dark:border-[#201533] bg-white/70 dark:bg-[#0B0813]/80 hover:bg-[#7052C8]/10 dark:hover:bg-[#9333EA]/20 text-[var(--color-ink)] transition-colors ${className ?? ""}`}
      title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4 text-[#C084FC] transition-transform rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 text-[#54329E] transition-transform rotate-0 scale-100" />
      )}
    </Button>
  );
}
