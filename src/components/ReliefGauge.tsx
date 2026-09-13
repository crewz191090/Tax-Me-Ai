"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { ReliefSummary } from "@/lib/reliefCalc";

const RADIUS = 70;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ReliefGauge({
  summary,
  totalCap,
}: {
  summary: ReliefSummary;
  totalCap: number;
}) {
  const { t } = useLanguage();
  const pct = totalCap > 0 ? Math.min(100, (summary.totalClaimable / totalCap) * 100) : 0;
  const dash = (pct / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id="reliefGaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r={RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth={STROKE} />
          <circle
            cx="90"
            cy="90"
            r={RADIUS}
            fill="none"
            stroke="url(#reliefGaugeGrad)"
            strokeWidth={STROKE}
            strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(167,139,250,0.4))" }}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-tight text-2xl font-bold text-accent">{pct.toFixed(0)}%</span>
          <span className="max-w-[90px] text-center text-[10px] leading-tight text-muted">
            {t("relief.gaugeLabel")}
          </span>
        </div>
      </div>
      <div className="text-center text-xs text-muted">
        RM {summary.totalClaimable.toFixed(2)} / RM {totalCap.toLocaleString()}
      </div>
    </div>
  );
}
