"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computeYearlyTrend,
  receiptInPeriod,
  type Period,
} from "@/lib/reliefCalc";
import { getExpenseCategory } from "@/lib/expenseCategories";
import CategoryPieChart from "./CategoryPieChart";
import SpendingTrendChart from "./SpendingTrendChart";
import GlassSegmentedControl from "./GlassSegmentedControl";
import TransactionsModal from "./TransactionsModal";
import type { Receipt } from "@/lib/types";

export default function ExpensesOverview({
  receipts,
  month,
  year,
}: {
  receipts: Receipt[];
  month: number;
  year: number;
}) {
  const { lang, t } = useLanguage();

  const [view, setView] = useState<"month" | "year">("month");
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  const period: Period =
    view === "month" ? { type: "month", year, month } : { type: "year", year };

  const breakdown = useMemo(
    () => computeCategoryBreakdown(receipts, period),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [receipts, view, year, month]
  );

  const trend = useMemo(
    () =>
      view === "month"
        ? computeMonthlyTrend(receipts, year, lang)
        : computeYearlyTrend(receipts),
    [receipts, view, year, lang]
  );

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("expenses.title")}</h2>

        <GlassSegmentedControl
          value={view}
          onChange={setView}
          className="text-xs"
          options={[
            { value: "month", label: t("expenses.viewMonth") },
            { value: "year", label: t("expenses.viewYear") },
          ]}
        />
      </div>
      <p className="mb-6 text-sm text-muted">{t("expenses.subtitle")}</p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted">
            {t("expenses.byCategory")}
          </h3>
          <CategoryPieChart rows={breakdown} onSelectCategory={setOpenCategoryId} />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted">
            {view === "month" ? `${t("expenses.trendMonth")} ${year}` : t("expenses.trendYear")}
          </h3>
          <SpendingTrendChart points={trend} />
        </div>
      </div>

      {openCategoryId && (
        <TransactionsModal
          title={t("expenses.transactionsFor").replace(
            "{category}",
            lang === "bm"
              ? getExpenseCategory(openCategoryId).nameBm
              : getExpenseCategory(openCategoryId).nameEn
          )}
          emptyText={t("expenses.noTransactions")}
          transactions={receipts.filter(
            (r) =>
              r.type === "expense" &&
              r.mainCategory === openCategoryId &&
              receiptInPeriod(r, period)
          )}
          onClose={() => setOpenCategoryId(null)}
        />
      )}
    </div>
  );
}
