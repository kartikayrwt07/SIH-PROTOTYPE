import React, { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Very soft, spread-out ambient glow that follows the cursor across the viewport.
 * Pointer-events are completely disabled so it never interferes with clicks or selections.
 */
export function CursorSpotlight() {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      animationFrameId = requestAnimationFrame(() => {
        setCoords({ x: e.clientX, y: e.clientY });
        if (!visible) setVisible(true);
      });
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [visible]);

  if (!coords || !visible) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 select-none"
      style={{
        opacity: visible ? 1 : 0,
        background: isDark
          ? `radial-gradient(700px circle at ${coords.x}px ${coords.y}px, rgba(147, 51, 234, 0.09), rgba(126, 34, 206, 0.035) 45%, transparent 75%)`
          : `radial-gradient(600px circle at ${coords.x}px ${coords.y}px, rgba(112, 82, 200, 0.04), rgba(112, 82, 200, 0.012) 40%, transparent 70%)`,
      }}
    />
  );
}
