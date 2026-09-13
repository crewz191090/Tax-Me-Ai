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
  const n = points.length;

  // The trend line shares the same 0-100 percentage space as the bars
  // beneath it, so it lines up with each bar's top regardless of container
  // width — a lightweight combo chart without a charting library.
  const linePoints = points.map((p, i) => {
    const heightPct = Math.max((p.total / max) * 100, p.total > 0 ? 3 : 0);
    return { x: ((i + 0.5) / n) * 100, y: 100 - heightPct, total: p.total };
  });
  const pathD = linePoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");

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

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id="trendLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#e879f9" />
            </linearGradient>
          </defs>
          <path
            d={pathD}
            fill="none"
            stroke="url(#trendLineGradient)"
            strokeWidth={1.6}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 3px rgba(129,140,248,0.7))" }}
          />
          {linePoints.map(
            (pt, i) =>
              pt.total > 0 && (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={1.8}
                  fill="#f5f3ff"
                  stroke="#a78bfa"
                  strokeWidth={0.8}
                  vectorEffect="non-scaling-stroke"
                />
              )
          )}
        </svg>

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
                      ? "linear-gradient(180deg, #c084fc, #6366f1)"
                      : "var(--surface-2)",
                  boxShadow: point.total > 0 ? "0 0 12px rgba(139,92,246,0.25)" : undefined,
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
