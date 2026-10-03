"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { BankNotificationCapture as Plugin, type PendingBankTransaction } from "@/lib/bankNotifications";
import type { BankTransactionPrefill } from "./UploadReceipt";

const DISMISS_KEY = "bankCaptureEnableDismissed";

// toISOString() is UTC, so a payment made between midnight and 8am in
// Malaysia (UTC+8) would be filed under the previous day.
function localDateString(epochMs: number): string {
  const d = new Date(epochMs);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export default function BankNotificationCapture({
  onReview,
}: {
  onReview: (prefill: BankTransactionPrefill) => void;
}) {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [promptDismissed, setPromptDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Private browsing / blocked storage — just don't persist the dismissal.
      return false;
    }
  });
  const [pending, setPending] = useState<PendingBankTransaction[]>([]);

  const native = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!native) return;

    Plugin.isEnabled()
      .then((res) => setEnabled(res.enabled))
      .catch(() => setEnabled(false));

    Plugin.getPending()
      .then(({ transactions }) => setPending(transactions))
      .catch(() => {});

    const listenerPromise = Plugin.addListener("transactionDetected", (transaction) => {
      setPending((prev) => (prev.some((p) => p.id === transaction.id) ? prev : [...prev, transaction]));
    });

    return () => {
      listenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, [native]);

  if (!native) return null;

  async function handleEnable() {
    await Plugin.openSettings().catch(() => {});
  }

  function handleDismiss() {
    setPromptDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore — worst case the prompt reappears next visit.
    }
  }

  async function handleDiscard(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
    await Plugin.clearPending({ ids: [id] }).catch(() => {});
  }

  async function handleReview(transaction: PendingBankTransaction) {
    onReview({
      merchant: transaction.merchant || transaction.bank,
      amount: transaction.amount,
      date: localDateString(transaction.postedAt),
      type: transaction.direction === "in" ? "income" : "expense",
    });
    setPending((prev) => prev.filter((p) => p.id !== transaction.id));
    await Plugin.clearPending({ ids: [transaction.id] }).catch(() => {});
  }

  return (
    <div className="mb-8 flex flex-col gap-3">
      {enabled === false && !promptDismissed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{t("bankCapture.enableTitle")}</p>
            <p className="mt-0.5 text-xs text-muted">{t("bankCapture.enableSubtitle")}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={handleDismiss} className="btn-pill btn-pill-ghost btn-pill-sm">
              {t("bankCapture.dismiss")}
            </button>
            <button onClick={handleEnable} className="btn-pill btn-pill-sm">
              {t("bankCapture.enable")}
            </button>
          </div>
        </div>
      )}

      {pending.map((transaction) => (
        <div
          key={transaction.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-surface p-4"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {t(transaction.direction === "in" ? "bankCapture.detectedIn" : "bankCapture.detectedOut")
                .replace("{bank}", transaction.bank)
                .replace("{amount}", transaction.amount.toFixed(2))}
            </p>
            {transaction.merchant && (
              <p className="mt-0.5 truncate text-xs text-muted">{transaction.merchant}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => handleDiscard(transaction.id)}
              className="btn-pill btn-pill-ghost btn-pill-sm"
            >
              {t("bankCapture.discard")}
            </button>
            <button onClick={() => handleReview(transaction)} className="btn-pill btn-pill-sm">
              {t("bankCapture.review")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
