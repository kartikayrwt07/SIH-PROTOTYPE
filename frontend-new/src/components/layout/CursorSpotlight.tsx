import React, { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Ultra-soft, perfectly smooth ambient purple glow that spreads out across the viewport.
 * Uses Gaussian blur filtering to completely eliminate gradient banding rings,
 * with GPU-accelerated translate3d and inertial lerp for 120fps/144fps smoothness.
 */
export function CursorSpotlight() {
  const glowRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    let targetX = -2000;
    let targetY = -2000;
    let currentX = -2000;
    let currentY = -2000;
    let rafId: number | null = null;
    let isMoving = false;
    let isVisible = false;

    const render = () => {
      // Smooth physical inertia
      const ease = 0.1;
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      currentX += dx * ease;
      currentY += dy * ease;

      el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

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
        className="pointer-events-none absolute left-0 top-0 w-[1200px] h-[1200px] -ml-[600px] -mt-[600px] rounded-full transition-opacity duration-700 ease-out"
        style={{
          opacity: 0,
          filter: "blur(60px)",
          willChange: "transform, opacity",
          background: isDark
            ? "radial-gradient(circle, rgba(168, 85, 247, 0.032) 0%, rgba(147, 51, 234, 0.018) 25%, rgba(147, 51, 234, 0.007) 50%, rgba(126, 34, 206, 0.002) 75%, transparent 90%)"
            : "radial-gradient(circle, rgba(147, 51, 234, 0.016) 0%, rgba(112, 82, 200, 0.009) 25%, rgba(112, 82, 200, 0.003) 50%, transparent 80%)",
        }}
      />
    </div>
  );
}
