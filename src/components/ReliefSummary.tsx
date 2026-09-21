"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  claimableForReceipt,
  computeReliefSummary,
  getReliefAlerts,
  groupYearlyDeductibleReceiptsByCategory,
  yearlyDeductibleReceipts,
  yearsWithReceipts,
} from "@/lib/reliefCalc";
import { RELIEF_CATEGORIES } from "@/lib/reliefCategories";
import { downloadYearlyTaxSummaryPdf } from "@/lib/exportPdf";
import { downloadYearlyTaxCsv } from "@/lib/exportCsv";
import ReliefGauge from "./ReliefGauge";
import ReliefCategoryDonut from "./ReliefCategoryDonut";
import TransactionsModal from "./TransactionsModal";
import ReceiptImageModal from "./ReceiptImageModal";
import type { Receipt } from "@/lib/types";

const TOTAL_RELIEF_CAP = RELIEF_CATEGORIES.filter((c) => c.cap > 0).reduce(
  (sum, c) => sum + c.cap,
  0
);

export default function ReliefSummary({ receipts }: { receipts: Receipt[] }) {
  const { lang, t } = useLanguage();
  const [year, setYear] = useState(new Date().getFullYear());
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);

  const availableYears = (() => {
    const years = new Set(yearsWithReceipts(receipts));
    years.add(year);
    return Array.from(years).sort((a, b) => b - a);
  })();

  // Tax relief is an annual concept (LHDN caps reset yearly), so this tab
  // deliberately does not use the dashboard's global month filter — only a
  // year selector, always scoped to the whole year.
  const summary = computeReliefSummary(receipts, year);
  const rowsWithSpend = summary.rows.filter((r) => r.spent > 0);
  const alerts = getReliefAlerts(summary.rows);
  const yearReceipts = yearlyDeductibleReceipts(receipts, year);
  const yearGroups = groupYearlyDeductibleReceiptsByCategory(receipts, year);

  async function handleExportPdf() {
    setExporting("pdf");
    try {
      await downloadYearlyTaxSummaryPdf(receipts, year, lang);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportCsv() {
    setExporting("csv");
    try {
      await downloadYearlyTaxCsv(receipts, year);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="glow-border rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("dashboard.reliefSummary")}</h2>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{t("dashboard.reliefSummaryFor")}</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-foreground outline-none"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mb-5 flex flex-col gap-2">
          {alerts.map((a) => (
            <div
              key={a.categoryId}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                a.level === "full"
                  ? "bg-red-500/10 text-red-300"
                  : "bg-amber-400/10 text-amber-300"
              }`}
            >
              <span>{a.level === "full" ? "🔴" : "⚠️"}</span>
              <span>
                {a.level === "full"
                  ? t("relief.alertFull")
                  : t("relief.alertWarning").replace("{pct}", a.pct.toFixed(0))}{" "}
                <span className="font-semibold">{lang === "bm" ? a.nameBm : a.nameEn}</span>{" "}
                (RM {a.spent.toFixed(2)} / RM {a.cap.toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex justify-center">
        <ReliefGauge summary={summary} totalCap={TOTAL_RELIEF_CAP} />
      </div>

      {rowsWithSpend.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("table.empty")}</p>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rowsWithSpend.map((row) => {
            const pct = Math.min(100, (row.spent / row.cap) * 100);
            const over = row.spent >= row.cap;
            return (
              <button
                key={row.categoryId}
                type="button"
                onClick={() => setOpenCategoryId(row.categoryId)}
                title={t("relief.viewTransactions")}
                className="flex gap-3 rounded-xl border border-border bg-surface-2/50 p-4 text-left transition-colors hover:border-accent/50 hover:bg-surface-2"
              >
                <ReliefCategoryDonut pct={pct} over={over} />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 truncate text-sm font-medium">
                    {lang === "bm" ? row.nameBm : row.nameEn}
                  </div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted">
                    <span>{t("relief.capLabel")}</span>
                    <span className="font-mono-tight">RM {row.cap.toLocaleString()}</span>
                  </div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted">
                    <span>{t("relief.usage")}</span>
                    <span className="font-mono-tight">RM {row.spent.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">{t("relief.remaining")}</span>
                    <span
                      className={`font-mono-tight font-semibold ${
                        over ? "text-red-400" : "text-accent"
                      }`}
                    >
                      RM {row.remaining.toFixed(2)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
        <span className="text-sm text-muted">{t("dashboard.totalClaimable")}</span>
        <span className="font-mono-tight text-lg font-bold text-accent">
          RM {summary.totalClaimable.toFixed(2)}
        </span>
      </div>

      <div className="border-t border-border pt-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">{t("tax.yearlySummary")}</h3>
            <p className="text-xs text-muted">{t("tax.yearlySummarySubtitle")}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting !== null || yearReceipts.length === 0}
              className="btn-pill btn-pill-outline btn-pill-sm disabled:opacity-50"
            >
              {exporting === "csv" ? t("tax.exporting") : t("tax.exportCsv")}
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting !== null || yearReceipts.length === 0}
              className="btn-pill btn-pill-sm disabled:opacity-50"
            >
              {exporting === "pdf" ? t("tax.exporting") : t("tax.exportPdf")}
            </button>
          </div>
        </div>

        {yearReceipts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t("tax.empty")}</p>
        ) : (
          <div className="flex flex-col gap-5">
            {yearGroups.map((group) => (
              <div key={group.categoryId}>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    {lang === "bm" ? group.nameBm : group.nameEn}
                  </h4>
                  <span className="font-mono-tight text-xs text-muted">
                    RM {group.totalClaimable.toFixed(2)}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-2/60 text-xs text-muted">
                        <th className="px-3 py-2 font-medium">{t("tax.colDate")}</th>
                        <th className="px-3 py-2 font-medium">{t("tax.colMerchant")}</th>
                        <th className="px-3 py-2 text-right font-medium">{t("tax.colAmount")}</th>
                        <th className="px-3 py-2 text-right font-medium">{t("tax.colClaimable")}</th>
                        <th className="px-3 py-2 text-center font-medium">{t("tax.colReceipt")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.receipts.map((r) => (
                        <tr key={r.id} className="border-b border-border/60 last:border-0">
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-muted">{r.date}</td>
                          <td className="px-3 py-2 font-medium">{r.merchant}</td>
                          <td className="font-mono-tight whitespace-nowrap px-3 py-2 text-right">
                            {r.amount.toFixed(2)}
                          </td>
                          <td className="font-mono-tight whitespace-nowrap px-3 py-2 text-right text-accent">
                            {claimableForReceipt(r).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {r.imageKey ? (
                              <button
                                type="button"
                                onClick={() => setViewingReceipt(r)}
                                title={t("tax.viewReceipt")}
                                className="inline-block h-10 w-10 overflow-hidden rounded-lg border border-border transition-colors hover:border-accent/50"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`/api/receipts/${r.id}/image`}
                                  alt={r.merchant}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingReceipt && (
        <ReceiptImageModal
          receiptId={viewingReceipt.id}
          merchant={viewingReceipt.merchant}
          onClose={() => setViewingReceipt(null)}
        />
      )}

      {openCategoryId && (
        <TransactionsModal
          title={t("relief.transactionsFor").replace(
            "{category}",
            lang === "bm"
              ? RELIEF_CATEGORIES.find((c) => c.id === openCategoryId)?.nameBm ?? ""
              : RELIEF_CATEGORIES.find((c) => c.id === openCategoryId)?.nameEn ?? ""
          )}
          emptyText={t("relief.noTransactions")}
          transactions={receipts.filter(
            (r) =>
              r.reliefCategory === openCategoryId &&
              Number(r.date.slice(0, 4)) === year
          )}
          onClose={() => setOpenCategoryId(null)}
        />
      )}
    </div>
  );
}
