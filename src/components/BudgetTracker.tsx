"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { INCOME_TYPES, getIncomeType } from "@/lib/incomeTypes";
import type { Receipt } from "@/lib/types";

interface MonthlyIncome {
  year: number;
  month: number;
  amount: number;
  incomeType: string;
}

function barColor(pct: number) {
  if (pct >= 100) return "bg-red-400";
  if (pct >= 70) return "bg-amber-400";
  return "bg-accent";
}

export default function BudgetTracker({ receipts }: { receipts: Receipt[] }) {
  const { lang, t } = useLanguage();
  const [income, setIncome] = useState<MonthlyIncome | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [typeInput, setTypeInput] = useState(INCOME_TYPES[0].id);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const loadIncome = useCallback(() => {
    fetch(`/api/income?year=${currentYear}&month=${currentMonth}`)
      .then((res) => res.json() as Promise<{ income?: MonthlyIncome | null }>)
      .then((json) => {
        setIncome(json.income ?? null);
        if (json.income) {
          setAmountInput(String(json.income.amount));
          setTypeInput(json.income.incomeType);
        }
      })
      .finally(() => setLoaded(true));
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadIncome();
  }, [loadIncome]);

  const spentThisMonth = useMemo(() => {
    let total = 0;
    for (const r of receipts) {
      if (r.type !== "expense") continue;
      const y = Number(r.date.slice(0, 4));
      const m = Number(r.date.slice(5, 7));
      if (y !== currentYear || m !== currentMonth) continue;
      total += r.amount;
    }
    return total;
  }, [receipts, currentYear, currentMonth]);

  async function handleSave() {
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) return;

    const res = await fetch("/api/income", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: currentYear, month: currentMonth, amount, incomeType: typeInput }),
    });
    if (!res.ok) return;

    setIncome({ year: currentYear, month: currentMonth, amount, incomeType: typeInput });
    setEditing(false);
  }

  async function handleRemove() {
    await fetch(`/api/income?year=${currentYear}&month=${currentMonth}`, { method: "DELETE" });
    setIncome(null);
    setAmountInput("");
    setEditing(false);
  }

  if (!loaded) return null;

  const remaining = income ? income.amount - spentThisMonth : 0;
  const pct = income ? Math.min(100, (spentThisMonth / income.amount) * 100) : 0;
  const over = income ? spentThisMonth > income.amount : false;
  const incomeType = income ? getIncomeType(income.incomeType) : null;

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("expenses.budgetTitle")}</h2>
        <button
          onClick={() => setEditing((v) => !v)}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-2"
        >
          {income ? t("expenses.budgetEdit") : t("expenses.budgetAdd")}
        </button>
      </div>
      <p className="mb-5 text-sm text-muted">{t("expenses.budgetSubtitle")}</p>

      {editing && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface-2/50 p-3">
          <label className="text-xs text-muted">
            {t("expenses.budgetIncomeAmount")}
            <input
              type="number"
              step="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="mt-1 block w-36 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
          <label className="text-xs text-muted">
            {t("expenses.budgetIncomeType")}
            <select
              value={typeInput}
              onChange={(e) => setTypeInput(e.target.value)}
              className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              {INCOME_TYPES.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.emoji} {lang === "bm" ? it.nameBm : it.nameEn}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleSave}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black hover:bg-accent-strong"
          >
            {t("expenses.budgetSave")}
          </button>
          {income && (
            <button
              onClick={handleRemove}
              className="rounded-full border border-border px-3 py-2 text-xs text-muted hover:text-red-400"
            >
              {t("expenses.budgetRemove")}
            </button>
          )}
        </div>
      )}

      {!income ? (
        <p className="py-6 text-center text-sm text-muted">{t("expenses.budgetNone")}</p>
      ) : (
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">
              {incomeType?.emoji} {lang === "bm" ? incomeType?.nameBm : incomeType?.nameEn}
            </span>
            <span className="font-mono-tight text-muted">
              RM {spentThisMonth.toFixed(2)} / RM {income.amount.toFixed(2)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full transition-all ${barColor(pct)}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {over
              ? `${t("expenses.budgetOver")}: RM ${(spentThisMonth - income.amount).toFixed(2)}`
              : `${t("expenses.budgetRemaining")}: RM ${remaining.toFixed(2)}`}
          </p>
        </div>
      )}
    </div>
  );
}
