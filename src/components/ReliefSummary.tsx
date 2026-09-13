"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { computeReliefSummary, getReliefAlerts, yearsWithReceipts } from "@/lib/reliefCalc";
import { RELIEF_CATEGORIES } from "@/lib/reliefCategories";
import ReliefGauge from "./ReliefGauge";
import ReliefCategoryDonut from "./ReliefCategoryDonut";
import type { Receipt } from "@/lib/types";

const TOTAL_RELIEF_CAP = RELIEF_CATEGORIES.filter((c) => c.cap > 0).reduce(
  (sum, c) => sum + c.cap,
  0
);

export default function ReliefSummary({ receipts }: { receipts: Receipt[] }) {
  const { lang, t } = useLanguage();
  const [year, setYear] = useState(new Date().getFullYear());

  const availableYears = (() => {
    const years = new Set(yearsWithReceipts(receipts));
    years.add(year);
    return Array.from(years).sort((a, b) => b - a);
  })();

  // Tax relief is an annual concept (LHDN caps reset yearly), so this tab
  // deliberately does not use the dashboard's global month filter — only a
  // year selector, always scoped to the whole year.
  const summary = computeReliefSummary(receipts, year);
  const rowsWithSpend = summary.rows.filter((r) => r.spent > 0);
  const alerts = getReliefAlerts(summary.rows);

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("dashboard.reliefSummary")}</h2>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{t("dashboard.reliefSummaryFor")}</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
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
                className="flex gap-3 rounded-xl border border-border bg-surface-2/50 p-4"
              >
                <ReliefCategoryDonut pct={pct} over={over} />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 truncate text-sm font-medium">
                    {lang === "bm" ? row.nameBm : row.nameEn}
                  </div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted">
                    <span>{t("relief.capLabel")}</span>
                    <span className="font-mono-tight">RM {row.cap.toLocaleString()}</span>
                  </div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted">
                    <span>{t("relief.usage")}</span>
                    <span className="font-mono-tight">RM {row.spent.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
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
