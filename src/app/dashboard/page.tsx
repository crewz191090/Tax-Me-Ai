"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import UploadReceipt from "@/components/UploadReceipt";
import ReceiptsTable from "@/components/ReceiptsTable";
import SummaryBar from "@/components/SummaryBar";
import { downloadCsv } from "@/lib/exportCsv";
import type { Receipt } from "@/lib/types";

export default function DashboardPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  function handleSaved(receipt: Receipt) {
    setReceipts((prev) => [receipt, ...prev]);
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Your receipts
              </h1>
              <p className="mt-1 text-sm text-muted">
                Scan, review and export — synced to your Cloudflare D1
                database and R2 storage.
              </p>
            </div>
            {receipts.length > 0 && (
              <button
                onClick={() => downloadCsv(receipts)}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
              >
                Export CSV
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
                <SummaryBar receipts={receipts} />
              </div>
              <ReceiptsTable receipts={receipts} onChange={setReceipts} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
