"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computeYearlyTrend,
  yearsWithReceipts,
  type Period,
} from "@/lib/reliefCalc";
import CategoryPieChart from "./CategoryPieChart";
import SpendingTrendChart from "./SpendingTrendChart";
import type { Receipt } from "@/lib/types";

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_BM = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember",
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function ExpensesOverview({ receipts }: { receipts: Receipt[] }) {
  const { lang, t } = useLanguage();

  const [view, setView] = useState<"month" | "year">("month");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const availableYears = useMemo(() => {
    const years = yearsWithReceipts(receipts);
    return years.length > 0 ? years : [currentYear];
  }, [receipts]);

  const breakdown = useMemo(() => {
    const period: Period =
      view === "month" ? { type: "month", year, month } : { type: "year", year };
    return computeCategoryBreakdown(receipts, period);
  }, [receipts, view, year, month]);

  const trend = useMemo(
    () =>
      view === "month"
        ? computeMonthlyTrend(receipts, year, lang)
        : computeYearlyTrend(receipts),
    [receipts, view, year, lang]
  );

  const monthNames = lang === "bm" ? MONTHS_BM : MONTHS_EN;

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("expenses.title")}</h2>

        <div className="flex items-center gap-1 rounded-full border border-border bg-surface-2 p-1 text-xs">
          <button
            onClick={() => setView("month")}
            className={`rounded-full px-3 py-1 transition-colors ${
              view === "month" ? "bg-accent text-black" : "text-muted hover:text-foreground"
            }`}
          >
            {t("expenses.viewMonth")}
          </button>
          <button
            onClick={() => setView("year")}
            className={`rounded-full px-3 py-1 transition-colors ${
              view === "year" ? "bg-accent text-black" : "text-muted hover:text-foreground"
            }`}
          >
            {t("expenses.viewYear")}
          </button>
        </div>
      </div>
      <p className="mb-5 text-sm text-muted">{t("expenses.subtitle")}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {view === "month" && (
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-foreground outline-none"
          >
            {monthNames.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        )}
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-foreground outline-none"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted">
            {t("expenses.byCategory")}
          </h3>
          <CategoryPieChart rows={breakdown} />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted">
            {view === "month" ? `${t("expenses.trendMonth")} ${year}` : t("expenses.trendYear")}
          </h3>
          <SpendingTrendChart points={trend} />
        </div>
      </div>
    </div>
  );
}
