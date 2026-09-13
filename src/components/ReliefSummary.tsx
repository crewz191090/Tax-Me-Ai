"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { computeReliefSummary, yearsWithReceipts } from "@/lib/reliefCalc";
import type { Receipt } from "@/lib/types";

export default function ReliefSummary({
  receipts,
  year,
  onYearChange,
}: {
  receipts: Receipt[];
  year: number;
  onYearChange: (year: number) => void;
}) {
  const { lang, t } = useLanguage();
  const years = new Set(yearsWithReceipts(receipts));
  years.add(year);
  const availableYears = Array.from(years).sort((a, b) => b - a);
  const summary = computeReliefSummary(receipts, year);
  const rowsWithSpend = summary.rows.filter((r) => r.spent > 0);

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("dashboard.reliefSummary")}</h2>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{t("dashboard.reliefSummaryFor")}</span>
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-foreground outline-none"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rowsWithSpend.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("table.empty")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {rowsWithSpend.map((row) => {
            const pct = Math.min(100, (row.spent / row.cap) * 100);
            return (
              <div key={row.categoryId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {lang === "bm" ? row.nameBm : row.nameEn}
                  </span>
                  <span className="font-mono-tight text-muted">
                    RM {row.spent.toFixed(2)} / RM {row.cap.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
        <span className="text-sm text-muted">{t("dashboard.totalClaimable")}</span>
        <span className="font-mono-tight text-lg font-bold text-accent">
          RM {summary.totalClaimable.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
