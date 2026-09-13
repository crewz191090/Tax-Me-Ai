"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { CategoryBreakdownRow } from "@/lib/reliefCalc";

export default function CategoryBreakdownChart({
  rows,
}: {
  rows: CategoryBreakdownRow[];
}) {
  const { lang, t } = useLanguage();

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{t("table.empty")}</p>;
  }

  const max = Math.max(...rows.map((r) => r.amount));

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const pct = max > 0 ? (row.amount / max) * 100 : 0;
        return (
          <div key={row.categoryId}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">
                {lang === "bm" ? row.nameBm : row.nameEn}
              </span>
              <span className="font-mono-tight whitespace-nowrap text-muted">
                RM {row.amount.toFixed(2)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full rounded-full transition-all ${
                  row.isDeductible ? "bg-accent" : "bg-muted/50"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
