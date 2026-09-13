"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MONTHS_BM, MONTHS_EN } from "@/lib/months";
import { yearsWithReceipts } from "@/lib/reliefCalc";
import type { IncomeEntry, Receipt } from "@/lib/types";

export default function CashFlowSummary({
  receipts,
  incomeEntries,
}: {
  receipts: Receipt[];
  incomeEntries: IncomeEntry[];
}) {
  const { lang, t } = useLanguage();
  const now = new Date();
  const [view, setView] = useState<"month" | "year">("month");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const monthNames = lang === "bm" ? MONTHS_BM : MONTHS_EN;

  const availableYears = useMemo(() => {
    const years = new Set(yearsWithReceipts(receipts));
    years.add(year);
    return Array.from(years).sort((a, b) => b - a);
  }, [receipts, year]);

  let income = 0;
  let expense = 0;

  for (const r of receipts) {
    const y = Number(r.date.slice(0, 4));
    if (y !== year) continue;
    if (view === "month") {
      const m = Number(r.date.slice(5, 7));
      if (m !== month) continue;
    }
    if (r.type === "income") income += r.amount;
    else if (r.type === "expense") expense += r.amount;
  }

  // Monthly income entries (salary, side income, etc.) are tracked
  // separately from receipt transactions, but they're still real income —
  // fold them into the same total so this summary matches what the user
  // set in the Monthly income tracker instead of looking disconnected.
  for (const e of incomeEntries) {
    if (e.year !== year) continue;
    if (view === "month" && e.month !== month) continue;
    income += e.amount;
  }

  const net = income - expense;
  const periodLabel = view === "month" ? `${monthNames[month - 1]} ${year}` : String(year);

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("cashflow.title")}</h2>
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

      <p className="mb-3 text-sm text-muted">
        {t("cashflow.subtitle")} {periodLabel}
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-2">
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-surface-2 p-4">
          <div className="text-xs text-muted">{t("cashflow.income")}</div>
          <div className="font-mono-tight mt-1 text-xl font-bold text-emerald-400">
            RM {income.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg bg-surface-2 p-4">
          <div className="text-xs text-muted">{t("cashflow.expense")}</div>
          <div className="font-mono-tight mt-1 text-xl font-bold text-rose-400">
            RM {expense.toFixed(2)}
          </div>
        </div>
        <div
          className={`rounded-lg p-4 ${net >= 0 ? "bg-accent/10" : "bg-rose-400/10"}`}
        >
          <div className="text-xs text-muted">{t("cashflow.net")}</div>
          <div
            className={`font-mono-tight mt-1 text-xl font-bold ${
              net >= 0 ? "text-accent" : "text-rose-400"
            }`}
          >
            {net >= 0 ? "+" : "−"}RM {Math.abs(net).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
