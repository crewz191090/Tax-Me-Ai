"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { CategoryBreakdownRow } from "@/lib/reliefCalc";

const PALETTE = [
  "#22d3ee", // cyan
  "#38bdf8", // sky
  "#6366f1", // indigo
  "#a78bfa", // violet
  "#f472b6", // pink
  "#34d399", // emerald
  "#fbbf24", // amber
  "#fb7185", // rose
  "#2dd4bf", // teal
  "#818cf8", // indigo-light
  "#4ade80", // green
  "#e879f9", // fuchsia
];

const RADIUS = 70;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CategoryPieChart({ rows }: { rows: CategoryBreakdownRow[] }) {
  const { lang, t } = useLanguage();
  const [hovered, setHovered] = useState<string | null>(null);

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{t("table.empty")}</p>;
  }

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  const segments = rows.reduce<
    { row: (typeof rows)[number]; color: string; dash: number; offset: number; pct: number }[]
  >((acc, row, i) => {
    const fraction = total > 0 ? row.amount / total : 0;
    const cumulativeBefore = acc.reduce((sum, s) => sum + s.pct / 100, 0);
    acc.push({
      row,
      color: PALETTE[i % PALETTE.length],
      dash: fraction * CIRCUMFERENCE,
      offset: -cumulativeBefore * CIRCUMFERENCE,
      pct: fraction * 100,
    });
    return acc;
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle
            cx="90"
            cy="90"
            r={RADIUS}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={STROKE}
          />
          {segments.map((seg) => (
            <circle
              key={seg.row.categoryId}
              cx="90"
              cy="90"
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === seg.row.categoryId ? STROKE + 4 : STROKE}
              strokeDasharray={`${seg.dash} ${CIRCUMFERENCE - seg.dash}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
              className="transition-all duration-200"
              onMouseEnter={() => setHovered(seg.row.categoryId)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-tight text-lg font-bold">
            RM {(hovered ? segments.find((s) => s.row.categoryId === hovered)!.row.amount : total).toFixed(2)}
          </span>
          <span className="text-[11px] text-muted">
            {hovered
              ? lang === "bm"
                ? segments.find((s) => s.row.categoryId === hovered)!.row.nameBm
                : segments.find((s) => s.row.categoryId === hovered)!.row.nameEn
              : t("expenses.pieTotal")}
          </span>
        </div>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        {segments.map((seg) => (
          <div
            key={seg.row.categoryId}
            onMouseEnter={() => setHovered(seg.row.categoryId)}
            onMouseLeave={() => setHovered(null)}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
              hovered === seg.row.categoryId ? "bg-surface-2" : ""
            }`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="flex flex-1 items-center gap-1 truncate">
              {seg.row.emoji} {lang === "bm" ? seg.row.nameBm : seg.row.nameEn}
              {seg.row.isDeductible && (
                <span
                  className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium text-accent"
                  title={t("expenses.legendDeductible")}
                >
                  🧾
                </span>
              )}
            </span>
            <span className="font-mono-tight text-muted">{seg.pct.toFixed(0)}%</span>
            <span className="font-mono-tight w-20 text-right font-medium">
              RM {seg.row.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
