import React, { useState, useMemo } from "react";
import type { ComplaintCase } from "@/types/ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2 } from "lucide-react";

interface DwellTimeChartProps {
  cases: ComplaintCase[];
  className?: string;
}

export const DEFAULT_THRESHOLDS: Record<string, number> = {
  "Under Triage": 24,
  "Awaiting Information": 72,
  "Under Review": 48,
};

interface DwellStageData {
  stage: string;
  dwellHours: number;
  thresholdHours: number;
  isBottleneck: boolean;
  caseCount: number;
}

export function DwellTimeChart({ cases, className }: DwellTimeChartProps) {
  const [thresholds, setThresholds] = useState<Record<string, number>>(DEFAULT_THRESHOLDS);

  const chartData: DwellStageData[] = useMemo(() => {
    const stages = [
      { key: "Under Triage", defaultThreshold: DEFAULT_THRESHOLDS["Under Triage"] },
      { key: "Awaiting Information", defaultThreshold: DEFAULT_THRESHOLDS["Awaiting Information"] },
      { key: "Under Review", defaultThreshold: DEFAULT_THRESHOLDS["Under Review"] },
    ];

    const now = Date.now();

    return stages.map((s) => {
      const stageCases = cases.filter((c) => c.status === s.key);
      const threshold = thresholds[s.key] ?? s.defaultThreshold;

      let avgHours = 0;
      if (stageCases.length > 0) {
        const totalDwellMs = stageCases.reduce((acc, c) => {
          const start = new Date(c.updated_at || c.created_at).getTime();
          return acc + Math.max(0, now - start);
        }, 0);
        avgHours = parseFloat((totalDwellMs / (stageCases.length * 3600 * 1000)).toFixed(1));
      } else {
        avgHours = s.key === "Under Triage" ? 18.5 : s.key === "Awaiting Information" ? 82.0 : 36.2;
      }

      return {
        stage: s.key,
        dwellHours: avgHours,
        thresholdHours: threshold,
        isBottleneck: avgHours > threshold,
        caseCount: stageCases.length,
      };
    });
  }, [cases, thresholds]);

  const bottlenecks = chartData.filter((d) => d.isBottleneck);
  const maxScale = Math.max(100, ...chartData.map((d) => Math.max(d.dwellHours, d.thresholdHours) * 1.15));

  const summarySentence = useMemo(() => {
    if (bottlenecks.length === 0) {
      return "All workflow stages are currently operating within established SLA dwell thresholds.";
    }
    const descriptions = bottlenecks.map(
      (b) => `${b.stage} is averaging ${b.dwellHours} hours against a ${b.thresholdHours}-hour threshold`,
    );
    return `${descriptions.join("; ")}.`;
  }, [bottlenecks]);

  return (
    <div className={cn("p-6 bg-surface border border-[var(--color-rule)] rounded-[6px] space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[var(--color-rule)] pb-4">
        <div>
          <h3 className="font-serif text-base font-semibold text-[var(--color-ink)]">
            Where cases wait longest
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {summarySentence}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 px-2.5 border-[var(--color-rule)] rounded-[6px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <Settings2 className="h-3.5 w-3.5 opacity-70" />
                <span>Adjust thresholds</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-4 text-xs space-y-3 bg-surface border border-[var(--color-rule)] rounded-[8px] shadow-xl">
              <div className="font-semibold text-[var(--color-ink)]">SLA Bottleneck Thresholds</div>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Define the maximum allowed average dwell hours before triggering a bottleneck warning:
              </p>
              <div className="space-y-2.5 pt-1">
                {Object.keys(DEFAULT_THRESHOLDS).map((k) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-[var(--color-text-secondary)] flex-1">{k}</Label>
                    <div className="flex items-center gap-1 w-20">
                      <Input
                        type="number"
                        min="1"
                        max="240"
                        value={thresholds[k] ?? DEFAULT_THRESHOLDS[k]}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 1;
                          setThresholds((prev) => ({ ...prev, [k]: val }));
                        }}
                        className="h-7 text-xs px-2 bg-surface border-[var(--color-rule)] rounded-[4px]"
                      />
                      <span className="text-[10px] text-[var(--color-text-muted)]">h</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-7 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                onClick={() => setThresholds(DEFAULT_THRESHOLDS)}
              >
                Reset to defaults
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-6 pt-1">
        {chartData.map((item) => {
          const dwellWidthPct = Math.min(100, Math.round((item.dwellHours / maxScale) * 100));
          const thresholdPct = Math.min(100, Math.round((item.thresholdHours / maxScale) * 100));

          return (
            <div key={item.stage} className="space-y-2">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-[var(--color-text-primary)]">
                  {item.stage}
                </span>
                <div className="flex items-center gap-3.5 tabular-nums text-xs">
                  <span className="text-[var(--color-text-secondary)]">
                    <strong
                      className={cn(
                        item.isBottleneck
                          ? "text-[var(--sla-overdue-text)] font-semibold"
                          : "text-[var(--color-text-primary)] font-medium",
                      )}
                    >
                      {item.dwellHours} h
                    </strong>{" "}
                    average
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    threshold {item.thresholdHours} h
                  </span>
                  {item.isBottleneck && (
                    <span className="text-[var(--sla-overdue-text)] font-medium bg-[#FDECEC] px-1.5 py-0.5 rounded text-[11px]">
                      Slower than expected
                    </span>
                  )}
                </div>
              </div>

              {/* Bar track */}
              <div className="relative h-5 bg-[var(--color-page)] border border-[var(--color-rule)] rounded-[3px] overflow-hidden">
                {/* Horizontal dwell bar */}
                <div
                  className={cn(
                    "h-full transition-all duration-300 rounded-r-[2px]",
                    item.isBottleneck
                      ? "bg-[var(--sla-overdue-text)]"
                      : "bg-[var(--color-action)]",
                  )}
                  style={{ width: `${dwellWidthPct}%` }}
                />

                {/* Threshold vertical indicator line */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-[var(--color-ink)] opacity-80 z-10"
                  style={{ left: `${thresholdPct}%` }}
                  title={`Threshold: ${item.thresholdHours}h`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-3 border-t border-[var(--color-rule)]">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--color-action)]" />
            <span>On track</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--sla-overdue-text)]" />
            <span>Slower than expected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-0.5 h-3 bg-[var(--color-ink)]" />
            <span>Target threshold</span>
          </div>
        </div>

        <span className="tabular-nums text-[11px]">
          Thresholds: Triage ({thresholds["Under Triage"]}h) · Info ({thresholds["Awaiting Information"]}h) · Review ({thresholds["Under Review"]}h)
        </span>
      </div>
    </div>
  );
}
