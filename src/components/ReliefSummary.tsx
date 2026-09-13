"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { computeReliefSummary, getReliefAlerts, yearsWithReceipts } from "@/lib/reliefCalc";
import { RELIEF_CATEGORIES } from "@/lib/reliefCategories";
import { MONTHS_BM, MONTHS_EN } from "@/lib/months";
import ReliefGauge from "./ReliefGauge";
import type { Receipt } from "@/lib/types";

const TOTAL_RELIEF_CAP = RELIEF_CATEGORIES.filter((c) => c.cap > 0).reduce(
  (sum, c) => sum + c.cap,
  0
);

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
  const [month, setMonth] = useState<number | null>(null);
  const monthNames = lang === "bm" ? MONTHS_BM : MONTHS_EN;

  const years = new Set(yearsWithReceipts(receipts));
  years.add(year);
  const availableYears = Array.from(years).sort((a, b) => b - a);
  const summary = computeReliefSummary(receipts, year, month);
  const rowsWithSpend = summary.rows.filter((r) => r.spent > 0);
  const alerts = getReliefAlerts(summary.rows);

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("dashboard.reliefSummary")}</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{t("dashboard.reliefSummaryFor")}</span>
          <select
            value={month ?? ""}
            onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-foreground outline-none"
          >
            <option value="">{t("relief.allYear")}</option>
            {monthNames.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
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

      {alerts.length > 0 && (
        <div className="mb-5 flex flex-col gap-2">
          {alerts.map((a) => (
            <div
              key={a.categoryId}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                a.level === "full"
                  ? "bg-red-500/10 text-red-300"
                  : "bg-amber-400/10 text-amber-300"
              }`}
            >
              <span>{a.level === "full" ? "🔴" : "⚠️"}</span>
              <span>
                {a.level === "full"
                  ? t("relief.alertFull")
                  : t("relief.alertWarning").replace("{pct}", a.pct.toFixed(0))}{" "}
                <span className="font-semibold">{lang === "bm" ? a.nameBm : a.nameEn}</span>{" "}
                (RM {a.spent.toFixed(2)} / RM {a.cap.toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex justify-center">
        <ReliefGauge summary={summary} totalCap={TOTAL_RELIEF_CAP} />
      </div>

      {rowsWithSpend.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("table.empty")}</p>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rowsWithSpend.map((row) => {
            const pct = Math.min(100, (row.spent / row.cap) * 100);
            const over = row.spent >= row.cap;
            return (
              <div
                key={row.categoryId}
                className="rounded-xl border border-border bg-surface-2/50 p-4"
              >
                <div className="mb-2 text-sm font-medium">
                  {lang === "bm" ? row.nameBm : row.nameEn}
                </div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted">
                  <span>{t("relief.capLabel")}</span>
                  <span className="font-mono-tight">RM {row.cap.toLocaleString()}</span>
                </div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted">
                  <span>{t("relief.usage")}</span>
                  <span className="font-mono-tight">RM {row.spent.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: over
                        ? "linear-gradient(90deg, #fb7185, #e11d48)"
                        : "linear-gradient(90deg, #22d3ee, #6366f1)",
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted">{t("relief.remaining")}</span>
                  <span
                    className={`font-mono-tight font-semibold ${
                      over ? "text-red-400" : "text-accent"
                    }`}
                  >
                    RM {row.remaining.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
        <span className="text-sm text-muted">{t("dashboard.totalClaimable")}</span>
        <span className="font-mono-tight text-lg font-bold text-accent">
          RM {summary.totalClaimable.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
