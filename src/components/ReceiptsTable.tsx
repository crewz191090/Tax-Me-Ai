"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { RELIEF_CATEGORIES, getReliefCategory } from "@/lib/reliefCategories";
import type { Receipt } from "@/lib/types";

export default function ReceiptsTable({
  receipts,
  onChange,
}: {
  receipts: Receipt[];
  onChange: (receipts: Receipt[]) => void;
}) {
  const { lang, t } = useLanguage();
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
    const res = await fetch(`/api/receipts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    if (!res.ok) return;
    onChange(receipts.map((r) => (r.id === id ? { ...r, category } : r)));
  }

  if (receipts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
        {t("table.empty")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3">{t("table.receipt")}</th>
            <th className="px-4 py-3">{t("table.date")}</th>
            <th className="px-4 py-3">{t("table.merchant")}</th>
            <th className="px-4 py-3">{t("table.amount")}</th>
            <th className="px-4 py-3">{t("table.category")}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {receipts.map((r) => {
            const category = getReliefCategory(r.category);
            return (
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
                      {RELIEF_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {lang === "bm" ? c.nameBm : c.nameEn}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingId(r.id)}
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        category.cap > 0
                          ? "bg-accent/15 text-accent"
                          : "bg-white/10 text-muted"
                      }`}
                    >
                      {lang === "bm" ? category.nameBm : category.nameEn}
                    </button>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={pendingId === r.id}
                    className="text-xs text-muted hover:text-red-400 disabled:opacity-50"
                  >
                    {pendingId === r.id ? t("table.deleting") : t("table.delete")}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
