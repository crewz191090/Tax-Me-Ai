"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { CategoryBreakdownRow } from "@/lib/reliefCalc";

// Each entry is a [from, to] gradient pair — a lighter tint fading into the
// base hue — so every pie slice reads as a glowing futuristic tube rather
// than a flat color chip.
const GRADIENT_PALETTE: [string, string][] = [
  ["#67e8f9", "#0891b2"], // cyan
  ["#7dd3fc", "#0284c7"], // sky
  ["#a5b4fc", "#4338ca"], // indigo
  ["#c4b5fd", "#7c3aed"], // violet
  ["#f9a8d4", "#db2777"], // pink
  ["#6ee7b7", "#059669"], // emerald
  ["#fde68a", "#d97706"], // amber
  ["#fda4af", "#e11d48"], // rose
  ["#5eead4", "#0d9488"], // teal
  ["#c7d2fe", "#4f46e5"], // indigo-light
  ["#86efac", "#16a34a"], // green
  ["#f0abfc", "#a21caf"], // fuchsia
];

const RADIUS = 70;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CategoryPieChart({
  rows,
  onSelectCategory,
}: {
  rows: CategoryBreakdownRow[];
  onSelectCategory?: (categoryId: string) => void;
}) {
  const { lang, t } = useLanguage();
  const [hovered, setHovered] = useState<string | null>(null);

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{t("table.empty")}</p>;
  }

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  const segments = rows.reduce<
    {
      row: (typeof rows)[number];
      gradId: string;
      swatch: string;
      dash: number;
      offset: number;
      pct: number;
    }[]
  >((acc, row, i) => {
    const fraction = total > 0 ? row.amount / total : 0;
    const cumulativeBefore = acc.reduce((sum, s) => sum + s.pct / 100, 0);
    const [from, to] = GRADIENT_PALETTE[i % GRADIENT_PALETTE.length];
    acc.push({
      row,
      gradId: `pieGrad${i}`,
      swatch: `linear-gradient(135deg, ${from}, ${to})`,
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
          <defs>
            {GRADIENT_PALETTE.map(([from, to], i) => (
              <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={from} />
                <stop offset="100%" stopColor={to} />
              </linearGradient>
            ))}
          </defs>
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
              stroke={`url(#${seg.gradId})`}
              strokeWidth={hovered === seg.row.categoryId ? STROKE + 4 : STROKE}
              strokeDasharray={`${seg.dash} ${CIRCUMFERENCE - seg.dash}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
              className="transition-all duration-200"
              style={{
                cursor: "pointer",
                filter:
                  hovered === seg.row.categoryId
                    ? "drop-shadow(0 0 6px rgba(103,232,249,0.5))"
                    : undefined,
              }}
              onMouseEnter={() => setHovered(seg.row.categoryId)}
              onMouseLeave={() => setHovered(null)}
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
          <button
            key={seg.row.categoryId}
            type="button"
            onClick={() => onSelectCategory?.(seg.row.categoryId)}
            onMouseEnter={() => setHovered(seg.row.categoryId)}
            onMouseLeave={() => setHovered(null)}
            title={t("expenses.viewTransactions")}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
              hovered === seg.row.categoryId ? "bg-surface-2" : ""
            } ${onSelectCategory ? "cursor-pointer hover:bg-surface-2" : ""}`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: seg.swatch }}
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
          </button>
        ))}
      </div>
    </div>
  );
}
