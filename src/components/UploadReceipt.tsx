"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type TransactionType,
} from "@/lib/expenseCategories";
import { RELIEF_CATEGORIES, getReliefCategory } from "@/lib/reliefCategories";
import type { ExtractedReceipt, Receipt } from "@/lib/types";

type Status = "idle" | "scanning" | "review" | "saving" | "error";

interface Draft {
  merchant: string;
  date: string;
  amount: number;
  subcategory: string;
  reliefCategory: string | null;
  isEInvoice: boolean;
  type: TransactionType;
  paymentMethod: string;
  accountName: string;
  tags: string;
  isRecurring: boolean;
  location: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function draftFromExtracted(extracted: ExtractedReceipt): Draft {
  return {
    merchant: extracted.merchant,
    date: extracted.date,
    amount: extracted.amount,
    subcategory: extracted.subcategory,
    reliefCategory: extracted.reliefCategory,
    isEInvoice: Boolean(extracted.isEInvoice),
    type: "expense",
    paymentMethod: "",
    accountName: "",
    tags: "",
    isRecurring: false,
    location: "",
  };
}

export default function UploadReceipt({
  onSaved,
}: {
  onSaved: (receipt: Receipt) => void;
}) {
  const { lang, t } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showMore, setShowMore] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(selectedFile: File) {
    setError(null);
    setStatus("scanning");
    setFile(selectedFile);

    try {
      const dataUrl = await fileToDataUrl(selectedFile);
      setPreview(dataUrl);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as {
        extracted?: ExtractedReceipt;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error || "Failed to scan receipt.");
      }

      setDraft(draftFromExtracted(json.extracted as ExtractedReceipt));
      setStatus("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  }

  async function handleSave() {
    if (!draft) return;
    setStatus("saving");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("merchant", draft.merchant);
      formData.append("date", draft.date);
      formData.append("amount", String(draft.amount));
      formData.append("subcategory", draft.subcategory);
      if (draft.reliefCategory) formData.append("reliefCategory", draft.reliefCategory);
      formData.append("type", draft.type);
      formData.append("isEInvoice", String(draft.isEInvoice));
      if (draft.paymentMethod) formData.append("paymentMethod", draft.paymentMethod);
      if (draft.accountName) formData.append("accountName", draft.accountName);
      if (draft.tags) formData.append("tags", draft.tags);
      formData.append("isRecurring", String(draft.isRecurring));
      if (draft.location) formData.append("location", draft.location);
      if (file) formData.append("file", file);

      const res = await fetch("/api/receipts", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as {
        receipt?: Receipt;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error || "Failed to save receipt.");
      }

      onSaved(json.receipt as Receipt);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save receipt.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setError(null);
    setPreview(null);
    setFile(null);
    setDraft(null);
    setShowMore(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
      />

      {status === "idle" && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50"
          }`}
        >
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-2xl">
            📷
          </span>
          <p className="text-sm font-medium">{t("upload.drop")}</p>
          <p className="mt-1 text-xs text-muted">{t("upload.hint")}</p>
        </div>
      )}

      {status === "scanning" && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          {preview && (
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-40 rounded-lg border border-border object-contain"
            />
          )}
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            {t("upload.scanning")}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={reset}
            className="rounded-full border border-border px-4 py-2 text-sm hover:bg-surface-2"
          >
            {t("upload.tryAgain")}
          </button>
        </div>
      )}

      {(status === "review" || status === "saving") && draft && (
        <div className="grid gap-6 md:grid-cols-2">
          {preview && (
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-72 w-full rounded-lg border border-border object-contain"
            />
          )}

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {t("upload.review")}
            </p>

            <label className="text-xs text-muted">
              {t("upload.merchant")}
              <input
                value={draft.merchant}
                onChange={(e) => setDraft({ ...draft, merchant: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted">
                {t("upload.date")}
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>
              <label className="text-xs text-muted">
                {t("upload.amount")}
                <input
                  type="number"
                  step="0.01"
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft({ ...draft, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted">
                {t("upload.subcategory")}
                <select
                  value={draft.subcategory}
                  onChange={(e) => setDraft({ ...draft, subcategory: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <optgroup
                      key={cat.id}
                      label={`${cat.emoji} ${lang === "bm" ? cat.nameBm : cat.nameEn}`}
                    >
                      {cat.subcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {lang === "bm" ? sub.nameBm : sub.nameEn}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted">
                {t("upload.type")}
                <select
                  value={draft.type}
                  onChange={(e) =>
                    setDraft({ ...draft, type: e.target.value as TransactionType })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                >
                  <option value="expense">{t("upload.typeExpense")}</option>
                  <option value="income">{t("upload.typeIncome")}</option>
                  <option value="transfer">{t("upload.typeTransfer")}</option>
                </select>
              </label>
            </div>

            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                draft.reliefCategory ? "bg-accent/15 text-accent" : "bg-white/10 text-muted"
              }`}
            >
              <span>{draft.reliefCategory ? "✅" : "⚪"}</span>
              <span>
                {draft.reliefCategory ? t("upload.deductibleYes") : t("upload.deductibleNo")}
              </span>
            </div>

            <label className="text-xs text-muted">
              {t("upload.reliefCategory")}
              <select
                value={draft.reliefCategory ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, reliefCategory: e.target.value || null })
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="">{t("upload.reliefNone")}</option>
                {RELIEF_CATEGORIES.filter((c) => c.cap > 0).map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "bm" ? c.nameBm : c.nameEn}
                  </option>
                ))}
              </select>
            </label>

            {draft.reliefCategory && (
              <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <span className="text-muted">{t("upload.annualCap")}</span>
                <span className="font-semibold text-accent">
                  RM {getReliefCategory(draft.reliefCategory).cap.toLocaleString()}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="flex items-center gap-1 text-left text-xs font-medium text-muted hover:text-foreground"
            >
              <span>{showMore ? "▾" : "▸"}</span>
              {t("upload.moreDetails")}
            </button>

            {showMore && (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2/50 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-muted">
                    {t("upload.paymentMethod")}
                    <select
                      value={draft.paymentMethod}
                      onChange={(e) => setDraft({ ...draft, paymentMethod: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                    >
                      <option value="">—</option>
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {lang === "bm" ? m.nameBm : m.nameEn}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-muted">
                    {t("upload.account")}
                    <input
                      value={draft.accountName}
                      onChange={(e) => setDraft({ ...draft, accountName: e.target.value })}
                      placeholder={t("upload.accountPlaceholder")}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                    />
                  </label>
                </div>

                <label className="text-xs text-muted">
                  {t("upload.tags")}
                  <input
                    value={draft.tags}
                    onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                    placeholder={t("upload.tagsPlaceholder")}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                  />
                </label>

                <label className="text-xs text-muted">
                  {t("upload.location")}
                  <input
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                  />
                </label>

                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={draft.isRecurring}
                    onChange={(e) => setDraft({ ...draft, isRecurring: e.target.checked })}
                    className="h-4 w-4 rounded border-border accent-cyan-400"
                  />
                  {t("upload.recurring")}
                </label>
              </div>
            )}

            <div className="mt-2 flex gap-3">
              <button
                onClick={handleSave}
                disabled={status === "saving"}
                className="flex-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black hover:bg-accent-strong disabled:opacity-60"
              >
                {status === "saving" ? t("upload.saving") : t("upload.save")}
              </button>
              <button
                onClick={reset}
                disabled={status === "saving"}
                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-surface-2 disabled:opacity-60"
              >
                {t("upload.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
