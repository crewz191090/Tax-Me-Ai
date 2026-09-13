"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { EXPENSE_CATEGORIES, getSubcategory } from "@/lib/expenseCategories";
import { getReliefCategory } from "@/lib/reliefCategories";
import ReceiptImageModal from "./ReceiptImageModal";
import type { Receipt } from "@/lib/types";

const TYPE_BADGE: Record<string, string> = {
  income: "bg-emerald-400/15 text-emerald-300",
  transfer: "bg-indigo-400/15 text-indigo-300",
};

export default function ReceiptsTable({
  receipts,
  onChange,
}: {
  receipts: Receipt[];
  onChange: (receipts: Receipt[]) => void;
}) {
  const { lang, t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);

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

  async function handleDateChange(id: string, date: string) {
    if (!date) return;
    const res = await fetch(`/api/receipts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    if (!res.ok) return;
    onChange(receipts.map((r) => (r.id === id ? { ...r, date } : r)));
  }

  async function handleSubcategoryChange(id: string, subcategory: string) {
    const res = await fetch(`/api/receipts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subcategory }),
    });
    if (!res.ok) return;
    const mainCategory = getSubcategory(subcategory)?.category.id ?? "other";
    onChange(
      receipts.map((r) => (r.id === id ? { ...r, subcategory, mainCategory } : r))
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
        {t("table.empty")}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[820px] text-left text-sm">
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
              const sub = getSubcategory(r.subcategory);
              const relief = r.reliefCategory ? getReliefCategory(r.reliefCategory) : null;
              return (
                <tr key={r.id} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3">
                    {r.imageKey ? (
                      <button
                        onClick={() => setViewingReceipt(r)}
                        className="block h-10 w-10 overflow-hidden rounded-lg border border-border transition-colors hover:border-accent/50"
                        title={t("image.view")}
                      >
                        <img
                          src={`/api/receipts/${r.id}/image`}
                          alt={r.merchant}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-xs text-muted">
                        —
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {editingDateId === r.id ? (
                      <input
                        type="date"
                        defaultValue={r.date}
                        autoFocus
                        onBlur={(e) => {
                          handleDateChange(r.id, e.target.value);
                          setEditingDateId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") setEditingDateId(null);
                        }}
                        className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingDateId(r.id)}
                        className="rounded-lg px-1.5 py-0.5 hover:bg-surface-2"
                        title={t("table.editDate")}
                      >
                        {r.date}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.merchant}
                      {r.type !== "expense" && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_BADGE[r.type]}`}
                        >
                          {r.type === "income" ? t("upload.typeIncome") : t("upload.typeTransfer")}
                        </span>
                      )}
                      {r.isEInvoice && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                          e-Invoice
                        </span>
                      )}
                      {r.isRecurring && (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-muted">
                          ↻
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-mono-tight whitespace-nowrap px-4 py-3">
                    RM {r.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {editingId === r.id ? (
                        <select
                          value={r.subcategory}
                          onChange={(e) => {
                            handleSubcategoryChange(r.id, e.target.value);
                            setEditingId(null);
                          }}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                          className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs outline-none"
                        >
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <optgroup
                              key={cat.id}
                              label={`${cat.emoji} ${lang === "bm" ? cat.nameBm : cat.nameEn}`}
                            >
                              {cat.subcategories.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {lang === "bm" ? s.nameBm : s.nameEn}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingId(r.id)}
                          className="w-fit rounded-full bg-white/10 px-2.5 py-1 text-xs text-foreground/90 hover:bg-white/15"
                        >
                          {sub
                            ? `${sub.category.emoji} ${lang === "bm" ? sub.subcategory.nameBm : sub.subcategory.nameEn}`
                            : "—"}
                        </button>
                      )}
                      {r.type === "expense" && (
                        <span
                          className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            relief ? "bg-accent/15 text-accent" : "bg-white/10 text-muted"
                          }`}
                        >
                          {relief
                            ? `✅ ${lang === "bm" ? relief.nameBm : relief.nameEn}`
                            : `⚪ ${t("table.notDeductible")}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {r.imageKey && (
                        <button
                          onClick={() => setViewingReceipt(r)}
                          className="text-xs text-muted hover:text-accent"
                        >
                          {t("image.view")}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={pendingId === r.id}
                        className="text-xs text-muted hover:text-red-400 disabled:opacity-50"
                      >
                        {pendingId === r.id ? t("table.deleting") : t("table.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
