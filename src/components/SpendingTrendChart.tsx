"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { TrendPoint } from "@/lib/reliefCalc";

export default function SpendingTrendChart({ points }: { points: TrendPoint[] }) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState<number | null>(null);

  if (points.every((p) => p.total === 0)) {
    return <p className="py-8 text-center text-sm text-muted">{t("table.empty")}</p>;
  }

  const max = Math.max(...points.map((p) => p.total), 1);

  return (
    <div>
      <div className="flex h-40 items-stretch gap-2">
        {points.map((point, i) => {
          const heightPct = (point.total / max) * 100;
          return (
            <div
              key={point.key}
              className="group relative flex flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && point.total > 0 && (
                <span className="font-mono-tight absolute -top-7 whitespace-nowrap rounded-md border border-border bg-surface-2 px-2 py-1 text-[11px] text-foreground shadow-lg">
                  RM {point.total.toFixed(2)}
                </span>
              )}
              <div
                className={`w-full rounded-t-sm transition-colors ${
                  point.total > 0 ? "bg-accent group-hover:bg-accent-strong" : "bg-surface-2"
                }`}
                style={{ height: `${Math.max(heightPct, point.total > 0 ? 4 : 2)}%` }}
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
