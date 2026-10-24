import React, { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Ultra-soft, faint ambient purple glow that smoothly glides with the cursor.
 * Uses GPU-accelerated translate3d with inertial lerp and zero React re-renders
 * during movement for maximum 120fps/144fps smoothness.
 * Pointer-events are disabled so it never interferes with any UI interaction.
 */
export function CursorSpotlight() {
  const glowRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;
    let rafId: number | null = null;
    let isMoving = false;
    let isVisible = false;

    const render = () => {
      // Inertial lerp for buttery smooth glide
      const ease = 0.12;
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      currentX += dx * ease;
      currentY += dy * ease;

      el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

      // Keep RAF going while moving or catching up
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 || isMoving) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = null;
      }
    };

    const startRaf = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        // Snap initial position so it doesn't fly across the screen from -1000
        currentX = targetX;
        currentY = targetY;
        el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        el.style.opacity = "1";
      }

      isMoving = true;
      startRaf();
    };

    const handleMouseLeave = () => {
      isVisible = false;
      isMoving = false;
      el.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-0 top-0 w-[850px] h-[850px] -ml-[425px] -mt-[425px] rounded-full transition-opacity duration-500 ease-out"
        style={{
          opacity: 0,
          willChange: "transform, opacity",
          background: isDark
            ? "radial-gradient(circle closest-side, rgba(168, 85, 247, 0.045) 0%, rgba(147, 51, 234, 0.022) 35%, rgba(126, 34, 206, 0.008) 65%, transparent 100%)"
            : "radial-gradient(circle closest-side, rgba(147, 51, 234, 0.02) 0%, rgba(112, 82, 200, 0.01) 35%, rgba(112, 82, 200, 0.003) 65%, transparent 100%)",
        }}
      />
    </div>
  );
}
