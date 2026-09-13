"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import UploadReceipt from "@/components/UploadReceipt";
import ReceiptsTable from "@/components/ReceiptsTable";
import SummaryBar from "@/components/SummaryBar";
import ReliefSummary from "@/components/ReliefSummary";
import ExpensesOverview from "@/components/ExpensesOverview";
import BudgetTracker from "@/components/BudgetTracker";
import CashFlowSummary from "@/components/CashFlowSummary";
import RecurringExpenses from "@/components/RecurringExpenses";
import AiInsights from "@/components/AiInsights";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { downloadCsv } from "@/lib/exportCsv";
import type { Receipt } from "@/lib/types";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    fetch("/api/receipts")
      .then((res) => res.json() as Promise<{ receipts?: Receipt[]; error?: string }>)
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setReceipts(json.receipts ?? []);
      })
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Failed to load receipts.")
      )
      .finally(() => setLoaded(true));
  }, [authLoading, user, router]);

  function handleSaved(receipt: Receipt) {
    setReceipts((prev) => [receipt, ...prev]);
  }

  if (authLoading || !user) {
    return (
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex-1 bg-grid">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t("dashboard.title")}
              </h1>
              <p className="mt-1 text-sm text-muted">{t("dashboard.subtitle")}</p>
            </div>
            {receipts.length > 0 && (
              <button
                onClick={() => downloadCsv(receipts)}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
              >
                {t("dashboard.export")}
              </button>
            )}
          </div>

          <div className="mb-8">
            <UploadReceipt onSaved={handleSaved} />
          </div>

          {loadError && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {loadError}
            </div>
          )}

          {loaded && (
            <>
              <div className="mb-6">
                <SummaryBar receipts={receipts} year={year} />
              </div>
              <div className="mb-6">
                <ExpensesOverview receipts={receipts} />
              </div>
              <div className="mb-6">
                <CashFlowSummary receipts={receipts} year={year} month={null} />
              </div>
              <div className="mb-6">
                <BudgetTracker receipts={receipts} />
              </div>
              <div className="mb-6">
                <ReliefSummary
                  receipts={receipts}
                  year={year}
                  onYearChange={setYear}
                />
              </div>
              <div className="mb-6">
                <AiInsights
                  receipts={receipts}
                  period={{ type: "year", year }}
                  periodLabel={String(year)}
                />
              </div>
              <div className="mb-6">
                <RecurringExpenses receipts={receipts} />
              </div>
              <ReceiptsTable receipts={receipts} onChange={setReceipts} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
