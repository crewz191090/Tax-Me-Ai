"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getSubcategory } from "@/lib/expenseCategories";
import type { Receipt } from "@/lib/types";

function clampedDate(year: number, month: number, day: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  const d = Math.min(day, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CloneExpenses({
  receipts,
  onCloned,
}: {
  receipts: Receipt[];
  onCloned: (receipt: Receipt) => void;
}) {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cloning, setCloning] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const candidates = useMemo(() => {
    const thisMonthKeys = new Set(
      receipts
        .filter((r) => {
          if (r.type !== "expense") return false;
          const y = Number(r.date.slice(0, 4));
          const m = Number(r.date.slice(5, 7));
          return y === year && m === month;
        })
        .map((r) => `${r.merchant}|${r.subcategory}|${r.amount}`)
    );

    return receipts.filter((r) => {
      if (r.type !== "expense") return false;
      if (!r.isRecurring && !r.loanTenureMonths) return false;
      const y = Number(r.date.slice(0, 4));
      const m = Number(r.date.slice(5, 7));
      if (y !== prevYear || m !== prevMonth) return false;
      if (r.loanTenureMonths && r.loanMonthIndex && r.loanMonthIndex >= r.loanTenureMonths) {
        return false;
      }
      const key = `${r.merchant}|${r.subcategory}|${r.amount}`;
      return !thisMonthKeys.has(key);
    });
  }, [receipts, year, month, prevYear, prevMonth]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleOpen() {
    if (!open) setSelected(new Set(candidates.map((c) => c.id)));
    setOpen((v) => !v);
  }

  async function handleClone() {
    setCloning(true);
    try {
      for (const r of candidates) {
        if (!selected.has(r.id)) continue;

        const day = Number(r.date.slice(8, 10));
        const date = clampedDate(year, month, day);

        const formData = new FormData();
        formData.append("merchant", r.merchant);
        formData.append("date", date);
        formData.append("amount", String(r.amount));
        formData.append("subcategory", r.subcategory);
        if (r.reliefCategory) formData.append("reliefCategory", r.reliefCategory);
        formData.append("type", r.type);
        formData.append("isEInvoice", "false");
        if (r.paymentMethod) formData.append("paymentMethod", r.paymentMethod);
        if (r.accountName) formData.append("accountName", r.accountName);
        if (r.tags) formData.append("tags", r.tags);
        formData.append("isRecurring", String(r.isRecurring));
        if (r.location) formData.append("location", r.location);
        if (r.loanTenureMonths) {
          formData.append("loanTenureMonths", String(r.loanTenureMonths));
          formData.append("loanMonthIndex", String((r.loanMonthIndex ?? 1) + 1));
        }

        const res = await fetch("/api/receipts", { method: "POST", body: formData });
        if (res.ok) {
          const json = (await res.json()) as { receipt: Receipt };
          onCloned(json.receipt);
        }
      }
      setOpen(false);
    } finally {
      setCloning(false);
    }
  }

  if (candidates.length === 0) return null;

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("clone.title")}</h2>
          <p className="text-sm text-muted">{t("clone.subtitle")}</p>
        </div>
        <button onClick={handleToggleOpen} className="btn-pill btn-pill-outline btn-pill-sm">
          {open ? t("clone.hide") : t("clone.show").replace("{n}", String(candidates.length))}
        </button>
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-2">
          {candidates.map((r) => {
            const sub = getSubcategory(r.subcategory);
            return (
              <label
                key={r.id}
                className="flex items-center gap-3 rounded-lg bg-surface-2/50 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  className="h-4 w-4 rounded border-border accent-cyan-400"
                />
                <span>{sub?.category.emoji ?? "📦"}</span>
                <span className="flex-1 truncate font-medium">
                  {r.merchant}
                  {sub && (
                    <span className="ml-2 text-xs text-muted">
                      {lang === "bm" ? sub.subcategory.nameBm : sub.subcategory.nameEn}
                    </span>
                  )}
                </span>
                {r.loanTenureMonths && (
                  <span className="rounded-full bg-indigo-400/15 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                    {t("clone.installment")} {(r.loanMonthIndex ?? 1) + 1}/{r.loanTenureMonths}
                  </span>
                )}
                <span className="font-mono-tight font-medium">RM {r.amount.toFixed(2)}</span>
              </label>
            );
          })}
          <button
            onClick={handleClone}
            disabled={cloning || selected.size === 0}
            className="btn-pill btn-pill-primary mt-2 self-start"
          >
            {cloning ? t("clone.cloning") : t("clone.cloneSelected").replace("{n}", String(selected.size))}
          </button>
        </div>
      )}
    </div>
  );
}
