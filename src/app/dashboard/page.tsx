"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import UploadReceipt from "@/components/UploadReceipt";
import CloneExpenses from "@/components/CloneExpenses";
import ReceiptsTable from "@/components/ReceiptsTable";
import SummaryBar from "@/components/SummaryBar";
import ReliefSummary from "@/components/ReliefSummary";
import ExpensesOverview from "@/components/ExpensesOverview";
import BudgetTracker from "@/components/BudgetTracker";
import CashFlowSummary from "@/components/CashFlowSummary";
import RecurringExpenses from "@/components/RecurringExpenses";
import AiInsights from "@/components/AiInsights";
import SyncStatusBanner from "@/components/SyncStatusBanner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { downloadCsv } from "@/lib/exportCsv";
import { downloadMonthlyExpensePdf } from "@/lib/exportPdf";
import { MONTHS_BM, MONTHS_EN } from "@/lib/months";
import { yearsWithReceipts } from "@/lib/reliefCalc";
import {
  clearPendingReceipts,
  getPendingReceipts,
  syncPendingReceipts,
  type SyncFailure,
} from "@/lib/offlineQueue";
import type { IncomeEntry, Receipt } from "@/lib/types";

export default function DashboardPage() {
  const { lang, t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const online = useOnlineStatus();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [tab, setTab] = useState<"expenses" | "tax">("expenses");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const now = new Date();
  // The single global filter — every component on the dashboard reads this
  // same month/year instead of managing its own, so picking a month here
  // changes what's shown everywhere at once.
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncErrors, setSyncErrors] = useState<SyncFailure[]>([]);

  const refreshReceipts = useCallback(() => {
    return fetch("/api/receipts")
      .then((res) => res.json() as Promise<{ receipts?: Receipt[]; error?: string }>)
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setReceipts(json.receipts ?? []);
      })
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Failed to load receipts.")
      );
  }, []);

  const refreshIncome = useCallback(() => {
    return fetch("/api/income")
      .then((res) => res.json() as Promise<{ entries?: IncomeEntry[] }>)
      .then((json) => setIncomeEntries(json.entries ?? []));
  }, []);

  const refreshPendingCount = useCallback(() => {
    getPendingReceipts().then((queue) => setPendingCount(queue.length));
  }, []);

  const runSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await syncPendingReceipts();
      setSyncErrors(result.failures);
      await refreshReceipts();
    } finally {
      await refreshPendingCount();
      setSyncing(false);
    }
  }, [refreshReceipts, refreshPendingCount]);

  async function handleDiscardFailed() {
    await clearPendingReceipts();
    setSyncErrors([]);
    await refreshPendingCount();
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    refreshReceipts().finally(() => setLoaded(true));
    refreshIncome();
    refreshPendingCount();
  }, [authLoading, user, router, refreshReceipts, refreshIncome, refreshPendingCount]);

  useEffect(() => {
    if (!online) return;
    // Coming back online (or loading while already online with a queue
    // left over from a previous session) — try to flush pending receipts.
    getPendingReceipts().then((queue) => {
      if (queue.length > 0) runSync();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  function handleSaved(receipt: Receipt) {
    setReceipts((prev) => [receipt, ...prev]);
  }

  function handleQueued() {
    refreshPendingCount();
  }

  const monthNames = lang === "bm" ? MONTHS_BM : MONTHS_EN;
  const availableYears = (() => {
    const years = new Set(yearsWithReceipts(receipts));
    years.add(year);
    return Array.from(years).sort((a, b) => b - a);
  })();

  function handleExportPdf() {
    downloadMonthlyExpensePdf(receipts, year, month, monthNames[month - 1], lang);
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("dashboard.title")}
            </h1>
            <p className="mt-1 text-sm text-muted">{t("dashboard.subtitle")}</p>
          </div>

          <SyncStatusBanner
            pendingCount={pendingCount}
            syncing={syncing}
            syncErrors={syncErrors}
            onSyncNow={runSync}
            onDiscardFailed={handleDiscardFailed}
          />

          <div className="mb-8">
            <UploadReceipt onSaved={handleSaved} onQueued={handleQueued} />
          </div>

          {loaded && (
            <div className="mb-8">
              <CloneExpenses receipts={receipts} onCloned={handleSaved} />
            </div>
          )}

          {loadError && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {loadError}
            </div>
          )}

          {loaded && (
            <>
              <div className="mb-6 flex items-center gap-1 rounded-full border border-border bg-surface-2 p-1 text-sm w-fit">
                <button
                  onClick={() => setTab("expenses")}
                  className={`rounded-full px-4 py-1.5 transition-colors ${
                    tab === "expenses" ? "bg-accent text-black" : "text-muted hover:text-foreground"
                  }`}
                >
                  {t("dashboard.tabExpenses")}
                </button>
                <button
                  onClick={() => setTab("tax")}
                  className={`rounded-full px-4 py-1.5 transition-colors ${
                    tab === "tax" ? "bg-accent text-black" : "text-muted hover:text-foreground"
                  }`}
                >
                  {t("dashboard.tabTax")}
                </button>
              </div>

              {tab === "expenses" && (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-surface-2/50 px-4 py-3">
                      <span className="text-xs font-medium text-muted">
                        {t("dashboard.globalFilter")}
                      </span>
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
                    </div>
                    {receipts.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={handleExportPdf} className="btn-pill btn-pill-outline">
                          📄 {t("expenses.exportPdf")}
                        </button>
                        <button
                          onClick={() => downloadCsv(receipts)}
                          className="btn-pill btn-pill-outline"
                        >
                          {t("dashboard.export")}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <SummaryBar receipts={receipts} month={month} year={year} />
                  </div>
                  <div className="mb-6">
                    <ExpensesOverview receipts={receipts} month={month} year={year} />
                  </div>
                  <div className="mb-6">
                    <CashFlowSummary
                      receipts={receipts}
                      incomeEntries={incomeEntries}
                      month={month}
                      year={year}
                    />
                  </div>
                  <div className="mb-6">
                    <BudgetTracker
                      receipts={receipts}
                      entries={incomeEntries}
                      onEntriesChange={setIncomeEntries}
                      month={month}
                      year={year}
                    />
                  </div>
                  <div className="mb-6">
                    <AiInsights
                      receipts={receipts}
                      incomeEntries={incomeEntries}
                      period={{ type: "month", year, month }}
                      periodLabel={`${monthNames[month - 1]} ${year}`}
                    />
                  </div>
                  <div className="mb-6">
                    <RecurringExpenses receipts={receipts} month={month} year={year} />
                  </div>
                  <ReceiptsTable
                    receipts={receipts}
                    onChange={setReceipts}
                    month={month}
                    year={year}
                  />
                </>
              )}

              {tab === "tax" && (
                <ReliefSummary receipts={receipts} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
