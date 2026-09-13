"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { EXPENSE_CATEGORIES, getExpenseCategory } from "@/lib/expenseCategories";
import type { Receipt } from "@/lib/types";

interface Budget {
  id: string;
  mainCategory: string;
  monthlyLimit: number;
}

function barColor(pct: number) {
  if (pct >= 100) return "bg-red-400";
  if (pct >= 70) return "bg-amber-400";
  return "bg-accent";
}

export default function BudgetTracker({ receipts }: { receipts: Receipt[] }) {
  const { lang, t } = useLanguage();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [newLimit, setNewLimit] = useState("");

  useEffect(() => {
    fetch("/api/budgets")
      .then((res) => res.json() as Promise<{ budgets?: Budget[] }>)
      .then((json) => setBudgets(json.budgets ?? []))
      .finally(() => setLoaded(true));
  }, []);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const spendByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of receipts) {
      if (r.type !== "expense") continue;
      const y = Number(r.date.slice(0, 4));
      const m = Number(r.date.slice(5, 7));
      if (y !== currentYear || m !== currentMonth) continue;
      map.set(r.mainCategory, (map.get(r.mainCategory) ?? 0) + r.amount);
    }
    return map;
  }, [receipts, currentYear, currentMonth]);

  async function handleAdd() {
    const limit = parseFloat(newLimit);
    if (!limit || limit <= 0) return;

    const res = await fetch("/api/budgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mainCategory: newCategory, monthlyLimit: limit }),
    });
    if (!res.ok) return;

    setBudgets((prev) => {
      const existing = prev.find((b) => b.mainCategory === newCategory);
      if (existing) {
        return prev.map((b) =>
          b.mainCategory === newCategory ? { ...b, monthlyLimit: limit } : b
        );
      }
      return [...prev, { id: `local_${newCategory}`, mainCategory: newCategory, monthlyLimit: limit }];
    });
    setNewLimit("");
    setAdding(false);
  }

  async function handleRemove(mainCategory: string) {
    await fetch(`/api/budgets/${mainCategory}`, { method: "DELETE" });
    setBudgets((prev) => prev.filter((b) => b.mainCategory !== mainCategory));
  }

  if (!loaded) return null;

  const categoriesWithoutBudget = EXPENSE_CATEGORIES.filter(
    (c) => !budgets.some((b) => b.mainCategory === c.id)
  );

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("expenses.budgetTitle")}</h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-2"
        >
          {t("expenses.budgetAdd")}
        </button>
      </div>
      <p className="mb-5 text-sm text-muted">{t("expenses.budgetSubtitle")}</p>

      {adding && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface-2/50 p-3">
          <label className="text-xs text-muted">
            {t("expenses.budgetCategory")}
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              {categoriesWithoutBudget.length > 0
                ? categoriesWithoutBudget.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {lang === "bm" ? c.nameBm : c.nameEn}
                    </option>
                  ))
                : EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {lang === "bm" ? c.nameBm : c.nameEn}
                    </option>
                  ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            {t("expenses.budgetLimit")}
            <input
              type="number"
              step="0.01"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className="mt-1 block w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
          <button
            onClick={handleAdd}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black hover:bg-accent-strong"
          >
            {t("expenses.budgetSave")}
          </button>
        </div>
      )}

      {budgets.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("expenses.budgetNone")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {budgets.map((b) => {
            const category = getExpenseCategory(b.mainCategory);
            const spent = spendByCategory.get(b.mainCategory) ?? 0;
            const pct = Math.min(100, (spent / b.monthlyLimit) * 100);
            const over = spent > b.monthlyLimit;
            return (
              <div key={b.mainCategory}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {category.emoji} {lang === "bm" ? category.nameBm : category.nameEn}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tight text-muted">
                      RM {spent.toFixed(2)} / RM {b.monthlyLimit.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemove(b.mainCategory)}
                      className="text-xs text-muted hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full transition-all ${barColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  {over
                    ? `${t("expenses.budgetOver")}: RM ${(spent - b.monthlyLimit).toFixed(2)}`
                    : `${t("expenses.budgetRemaining")}: RM ${(b.monthlyLimit - spent).toFixed(2)}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
