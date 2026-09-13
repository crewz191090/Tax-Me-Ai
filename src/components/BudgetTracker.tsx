"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { INCOME_TYPES, getIncomeType } from "@/lib/incomeTypes";
import type { IncomeEntry, Receipt } from "@/lib/types";

function barColor(pct: number) {
  if (pct >= 100) return "bg-red-400";
  if (pct >= 70) return "bg-amber-400";
  return "bg-accent";
}

interface EntryForm {
  amount: string;
  incomeType: string;
  label: string;
}

const EMPTY_FORM: EntryForm = { amount: "", incomeType: INCOME_TYPES[0].id, label: "" };

export default function BudgetTracker({
  receipts,
  entries,
  onEntriesChange,
}: {
  receipts: Receipt[];
  entries: IncomeEntry[];
  onEntriesChange: (entries: IncomeEntry[]) => void;
}) {
  const { lang, t } = useLanguage();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>(EMPTY_FORM);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const monthEntries = useMemo(
    () => entries.filter((e) => e.year === currentYear && e.month === currentMonth),
    [entries, currentYear, currentMonth]
  );

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

  const totalIncome = monthEntries.reduce((sum, e) => sum + e.amount, 0);

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(entry: IncomeEntry) {
    setForm({ amount: String(entry.amount), incomeType: entry.incomeType, label: entry.label ?? "" });
    setEditingId(entry.id);
    setAdding(true);
  }

  function cancelForm() {
    setAdding(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;
    const label = form.label.trim() || null;

    if (editingId) {
      const res = await fetch(`/api/income/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, incomeType: form.incomeType, label }),
      });
      if (!res.ok) return;
      onEntriesChange(
        entries.map((e) => (e.id === editingId ? { ...e, amount, incomeType: form.incomeType, label } : e))
      );
    } else {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: currentYear,
          month: currentMonth,
          amount,
          incomeType: form.incomeType,
          label,
        }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { id: string };
      onEntriesChange([
        ...entries,
        { id: json.id, year: currentYear, month: currentMonth, amount, incomeType: form.incomeType, label },
      ]);
    }

    cancelForm();
  }

  async function handleRemove(id: string) {
    await fetch(`/api/income/${id}`, { method: "DELETE" });
    onEntriesChange(entries.filter((e) => e.id !== id));
    if (editingId === id) cancelForm();
  }

  const remaining = totalIncome - spentThisMonth;
  const pct = totalIncome > 0 ? Math.min(100, (spentThisMonth / totalIncome) * 100) : 0;
  const over = totalIncome > 0 && spentThisMonth > totalIncome;

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("expenses.budgetTitle")}</h2>
        {!adding && (
          <button
            onClick={startAdd}
            className="btn-pill btn-pill-primary btn-pill-sm"
          >
            {monthEntries.length > 0 ? t("expenses.budgetAddAnother") : t("expenses.budgetAdd")}
          </button>
        )}
      </div>
      <p className="mb-5 text-sm text-muted">{t("expenses.budgetSubtitle")}</p>

      {adding && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface-2/50 p-3">
          <label className="text-xs text-muted">
            {t("expenses.budgetIncomeAmount")}
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1 block w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
          <label className="text-xs text-muted">
            {t("expenses.budgetIncomeType")}
            <select
              value={form.incomeType}
              onChange={(e) => setForm((f) => ({ ...f, incomeType: e.target.value }))}
              className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              {INCOME_TYPES.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.emoji} {lang === "bm" ? it.nameBm : it.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            {t("expenses.budgetLabel")}
            <input
              type="text"
              value={form.label}
              placeholder={t("expenses.budgetLabelPlaceholder")}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="mt-1 block w-44 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
          <button onClick={handleSave} className="btn-pill btn-pill-primary">
            {t("expenses.budgetSave")}
          </button>
          <button onClick={cancelForm} className="btn-pill btn-pill-ghost">
            {t("expenses.budgetCancel")}
          </button>
        </div>
      )}

      {monthEntries.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("expenses.budgetNone")}</p>
      ) : (
        <div className="mb-5 flex flex-col gap-2">
          {monthEntries.map((entry) => {
            const incomeType = getIncomeType(entry.incomeType);
            return (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-2/50 px-3 py-2"
              >
                <span className="text-sm">
                  {incomeType.emoji} {entry.label || (lang === "bm" ? incomeType.nameBm : incomeType.nameEn)}
                  {entry.label && (
                    <span className="ml-2 text-xs text-muted">
                      ({lang === "bm" ? incomeType.nameBm : incomeType.nameEn})
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tight text-sm text-muted">RM {entry.amount.toFixed(2)}</span>
                  <button
                    onClick={() => startEdit(entry)}
                    className="btn-pill btn-pill-outline btn-pill-sm"
                  >
                    {t("expenses.budgetEdit")}
                  </button>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="btn-pill btn-pill-danger btn-pill-sm"
                  >
                    {t("expenses.budgetRemove")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {monthEntries.length > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">{t("expenses.budgetTotalIncome")}</span>
            <span className="font-mono-tight text-muted">
              RM {spentThisMonth.toFixed(2)} / RM {totalIncome.toFixed(2)}
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
              ? `${t("expenses.budgetOver")}: RM ${(spentThisMonth - totalIncome).toFixed(2)}`
              : `${t("expenses.budgetRemaining")}: RM ${remaining.toFixed(2)}`}
          </p>
        </div>
      )}
    </div>
  );
}
