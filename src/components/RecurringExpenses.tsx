"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getSubcategory } from "@/lib/expenseCategories";
import type { Receipt } from "@/lib/types";

export default function RecurringExpenses({
  receipts,
  month,
  year,
}: {
  receipts: Receipt[];
  month: number;
  year: number;
}) {
  const { lang, t } = useLanguage();
  const recurring = receipts.filter((r) => {
    if (!r.isRecurring || r.type !== "expense") return false;
    const y = Number(r.date.slice(0, 4));
    const m = Number(r.date.slice(5, 7));
    return y === year && m === month;
  });

  const monthlyTotal = recurring.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold">{t("recurring.title")}</h2>
      <p className="mb-5 text-sm text-muted">{t("recurring.subtitle")}</p>

      {recurring.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("recurring.none")}</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {recurring.map((r) => {
              const sub = getSubcategory(r.subcategory);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{sub?.category.emoji ?? "📦"}</span>
                    <span className="font-medium">{r.merchant}</span>
                    <span className="text-xs text-muted">
                      {sub ? (lang === "bm" ? sub.subcategory.nameBm : sub.subcategory.nameEn) : ""}
                    </span>
                  </div>
                  <span className="font-mono-tight font-medium">RM {r.amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3">
            <span className="text-sm text-muted">{t("recurring.monthlyTotal")}</span>
            <span className="font-mono-tight text-lg font-bold text-accent">
              RM {monthlyTotal.toFixed(2)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
