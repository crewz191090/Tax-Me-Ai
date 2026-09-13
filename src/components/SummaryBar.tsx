"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { computeReliefSummary } from "@/lib/reliefCalc";
import type { Receipt } from "@/lib/types";

export default function SummaryBar({
  receipts,
  year,
}: {
  receipts: Receipt[];
  year: number;
}) {
  const { t } = useLanguage();
  const total = receipts.reduce((sum, r) => sum + r.amount, 0);
  const summary = computeReliefSummary(receipts, year);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="text-xs text-muted">{t("summary.totalReceipts")}</div>
        <div className="font-mono-tight mt-1 text-2xl font-bold">{receipts.length}</div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="text-xs text-muted">{t("summary.totalSpent")}</div>
        <div className="font-mono-tight mt-1 text-2xl font-bold">RM {total.toFixed(2)}</div>
      </div>
      <div className="glow-border rounded-xl border border-accent/40 bg-surface-2 p-5">
        <div className="text-xs text-muted">{t("summary.claimable")}</div>
        <div className="font-mono-tight mt-1 text-2xl font-bold text-accent">
          RM {summary.totalClaimable.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
