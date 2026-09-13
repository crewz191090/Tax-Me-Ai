"use client";

import { useState } from "react";
import { CATEGORIES, deductiblePercentForCategory } from "@/lib/categories";
import type { Receipt } from "@/lib/types";

function badgeColor(pct: number) {
  if (pct === 100) return "bg-accent/15 text-accent";
  if (pct === 0) return "bg-white/10 text-muted";
  return "bg-amber-400/15 text-amber-300";
}

export default function ReceiptsTable({
  receipts,
  onChange,
}: {
  receipts: Receipt[];
  onChange: (receipts: Receipt[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/receipts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete receipt.");
      onChange(receipts.filter((r) => r.id !== id));
    } catch {
      // leave the list unchanged; a toast could surface this in a future pass
    } finally {
      setPendingId(null);
    }
  }

  async function handleCategoryChange(id: string, category: string) {
    const deductiblePercent = deductiblePercentForCategory(category);
    const res = await fetch(`/api/receipts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    if (!res.ok) return;
    onChange(
      receipts.map((r) =>
        r.id === id ? { ...r, category, deductiblePercent } : r
      )
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
        No receipts yet. Upload your first one above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3">Receipt</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Merchant</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Deductible</th>
            <th className="px-4 py-3">Claimable</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {receipts.map((r) => (
            <tr key={r.id} className="hover:bg-surface-2/60">
              <td className="px-4 py-3">
                {r.imageKey ? (
                  <img
                    src={`/api/receipts/${r.id}/image`}
                    alt={r.merchant}
                    className="h-10 w-10 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-xs text-muted">
                    —
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">{r.date}</td>
              <td className="px-4 py-3 font-medium">
                <div className="flex items-center gap-2">
                  {r.merchant}
                  {r.isEInvoice && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                      e-Invoice
                    </span>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                RM {r.amount.toFixed(2)}
              </td>
              <td className="px-4 py-3">
                {editingId === r.id ? (
                  <select
                    value={r.category}
                    onChange={(e) => {
                      handleCategoryChange(r.id, e.target.value);
                      setEditingId(null);
                    }}
                    onBlur={() => setEditingId(null)}
                    autoFocus
                    className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button
                    onClick={() => setEditingId(r.id)}
                    className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted hover:text-foreground"
                  >
                    {r.category}
                  </button>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeColor(
                    r.deductiblePercent
                  )}`}
                >
                  {r.deductiblePercent}%
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-accent">
                RM {((r.amount * r.deductiblePercent) / 100).toFixed(2)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={pendingId === r.id}
                  className="text-xs text-muted hover:text-red-400 disabled:opacity-50"
                >
                  {pendingId === r.id ? "Deleting…" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
