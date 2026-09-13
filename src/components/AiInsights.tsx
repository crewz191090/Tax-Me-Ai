"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { computeCategoryBreakdown, type Period } from "@/lib/reliefCalc";
import type { Receipt } from "@/lib/types";

export default function AiInsights({
  receipts,
  period,
  periodLabel,
}: {
  receipts: Receipt[];
  period: Period;
  periodLabel: string;
}) {
  const { lang, t } = useLanguage();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(false);
    setInsight(null);

    try {
      const breakdown = computeCategoryBreakdown(receipts, period);
      const totalSpent = breakdown.reduce((sum, r) => sum + r.amount, 0);
      const totalIncome = receipts
        .filter((r) => r.type === "income")
        .reduce((sum, r) => sum + r.amount, 0);

      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodLabel,
          totalSpent,
          totalIncome,
          breakdown: breakdown.map((b) => ({
            name: lang === "bm" ? b.nameBm : b.nameEn,
            amount: b.amount,
          })),
          lang,
        }),
      });

      const json = (await res.json()) as { insight?: string; error?: string };
      if (!res.ok || !json.insight) throw new Error(json.error || "Failed");

      setInsight(json.insight);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <span>✨</span> {t("insights.title")}
        </h2>
        <button onClick={handleGenerate} disabled={loading} className="btn-pill btn-pill-primary btn-pill-sm">
          {loading ? t("insights.loading") : t("insights.generate")}
        </button>
      </div>
      <p className="mb-4 text-sm text-muted">{t("insights.subtitle")}</p>

      {error && <p className="text-sm text-red-400">{t("insights.error")}</p>}

      {insight && (
        <p className="rounded-lg bg-surface-2 p-4 text-sm leading-relaxed text-foreground/90">
          {insight}
        </p>
      )}
    </div>
  );
}
