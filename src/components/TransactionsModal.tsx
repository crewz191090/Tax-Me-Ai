"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ReceiptImageModal from "./ReceiptImageModal";
import type { Receipt } from "@/lib/types";

export default function TransactionsModal({
  title,
  emptyText,
  transactions,
  onClose,
}: {
  title: string;
  emptyText: string;
  transactions: Receipt[];
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="glass glow-border max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <span className="truncate text-sm font-semibold">{title}</span>
            <button
              onClick={onClose}
              aria-label={t("image.close")}
              className="rounded-full border border-border p-1.5 text-muted hover:bg-surface-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-4">
            {sorted.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">{emptyText}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sorted.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2/50 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {r.imageKey ? (
                        <button
                          onClick={() => setViewingReceipt(r)}
                          className="block h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border transition-colors hover:border-accent/50"
                          title={t("image.view")}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/receipts/${r.id}/image`}
                            alt={r.merchant}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ) : (
                        <span
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-surface-2 text-muted"
                          title={t("table.noImage")}
                        >
                          🖼️
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.merchant}</div>
                        <div className="text-xs text-muted">{r.date}</div>
                      </div>

                      <span className="font-mono-tight shrink-0 text-sm font-semibold text-accent sm:hidden">
                        RM {r.amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                      <span className="font-mono-tight hidden text-sm font-semibold text-accent sm:inline">
                        RM {r.amount.toFixed(2)}
                      </span>
                      {r.imageKey && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setViewingReceipt(r)}
                            className="btn-pill btn-pill-outline btn-pill-sm"
                          >
                            {t("image.view")}
                          </button>
                          <a
                            href={`/api/receipts/${r.id}/image`}
                            download={`${r.merchant.replace(/[^\w-]+/g, "_")}.jpg`}
                            className="btn-pill btn-pill-outline btn-pill-sm"
                          >
                            {t("image.download")}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewingReceipt && (
        <ReceiptImageModal
          receiptId={viewingReceipt.id}
          merchant={viewingReceipt.merchant}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </>
  );
}
