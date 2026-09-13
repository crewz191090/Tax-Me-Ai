"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Receipt } from "@/lib/types";

export default function CashFlowSummary({
  receipts,
  year,
  month,
}: {
  receipts: Receipt[];
  year: number;
  month: number | null;
}) {
  const { t } = useLanguage();

  let income = 0;
  let expense = 0;

  for (const r of receipts) {
    const y = Number(r.date.slice(0, 4));
    if (y !== year) continue;
    if (month !== null) {
      const m = Number(r.date.slice(5, 7));
      if (m !== month) continue;
    }
    if (r.type === "income") income += r.amount;
    else if (r.type === "expense") expense += r.amount;
  }

  const net = income - expense;

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-5 text-lg font-semibold">{t("cashflow.title")}</h2>
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
