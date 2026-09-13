"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { computeReliefSummary, yearsWithReceipts } from "@/lib/reliefCalc";
import { MONTHS_BM, MONTHS_EN } from "@/lib/months";
import type { Receipt } from "@/lib/types";

export default function SummaryBar({ receipts }: { receipts: Receipt[] }) {
  const { lang, t } = useLanguage();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const monthNames = lang === "bm" ? MONTHS_BM : MONTHS_EN;

  const availableYears = useMemo(() => {
    const years = new Set(yearsWithReceipts(receipts));
    years.add(year);
    return Array.from(years).sort((a, b) => b - a);
  }, [receipts, year]);

  const monthReceipts = useMemo(
    () =>
      receipts.filter((r) => {
        const y = Number(r.date.slice(0, 4));
        const m = Number(r.date.slice(5, 7));
        return y === year && m === month;
      }),
    [receipts, year, month]
  );

  const totalSpent = monthReceipts
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);
  const summary = computeReliefSummary(receipts, year);
  const periodLabel = `${monthNames[month - 1]} ${year}`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
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
        <span className="text-xs text-muted">{t("summary.for")} {periodLabel}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="text-xs text-muted">{t("summary.totalReceipts")}</div>
          <div className="font-mono-tight mt-1 text-2xl font-bold">{monthReceipts.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="text-xs text-muted">{t("summary.totalSpent")}</div>
          <div className="font-mono-tight mt-1 text-2xl font-bold">RM {totalSpent.toFixed(2)}</div>
        </div>
        <div className="glow-border rounded-xl border border-accent/40 bg-surface-2 p-5">
          <div className="text-xs text-muted">{t("summary.claimable")}</div>
          <div className="font-mono-tight mt-1 text-2xl font-bold text-accent">
            RM {summary.totalClaimable.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
