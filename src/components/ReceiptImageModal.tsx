"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ReceiptImageModal({
  receiptId,
  merchant,
  onClose,
}: {
  receiptId: string;
  merchant: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const imageUrl = `/api/receipts/${receiptId}/image`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass glow-border max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="truncate text-sm font-medium">{merchant}</span>
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
        <div className="max-h-[75vh] overflow-auto bg-background p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={merchant} className="mx-auto max-w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
