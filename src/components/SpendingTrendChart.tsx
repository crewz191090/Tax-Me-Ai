"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { TrendPoint } from "@/lib/reliefCalc";

function formatCompact(value: number): string {
  if (value === 0) return "";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(0);
}

export default function SpendingTrendChart({ points }: { points: TrendPoint[] }) {
  const { t } = useLanguage();

  if (points.every((p) => p.total === 0)) {
    return <p className="py-8 text-center text-sm text-muted">{t("table.empty")}</p>;
  }

  const max = Math.max(...points.map((p) => p.total), 1);
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <div>
      <div className="relative flex h-48 items-stretch gap-2 pt-6">
        {gridLines.map((g) => (
          <div
            key={g}
            className="pointer-events-none absolute inset-x-0 border-t border-border/50"
            style={{ bottom: `${g * 100}%` }}
          />
        ))}

        {points.map((point) => {
          const heightPct = (point.total / max) * 100;
          return (
            <div
              key={point.key}
              className="group relative z-10 flex flex-1 flex-col items-center justify-end"
            >
              {point.total > 0 && (
                <span className="font-mono-tight mb-1 whitespace-nowrap text-[10px] font-medium text-foreground/80">
                  {formatCompact(point.total)}
                </span>
              )}
              <div
                className="w-full rounded-t-md transition-all group-hover:brightness-110"
                style={{
                  height: `${Math.max(heightPct, point.total > 0 ? 3 : 1)}%`,
                  background:
                    point.total > 0
                      ? "linear-gradient(180deg, var(--accent-strong), var(--accent))"
                      : "var(--surface-2)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {points.map((point) => (
          <span
            key={point.key}
            className="flex-1 text-center text-[11px] text-muted"
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
