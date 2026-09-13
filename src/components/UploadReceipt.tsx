"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type TransactionType,
} from "@/lib/expenseCategories";
import { RELIEF_CATEGORIES, getReliefCategory } from "@/lib/reliefCategories";
import { extractReceiptLocally } from "@/lib/localOcr";
import { addPendingReceipt } from "@/lib/offlineQueue";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import type { ExtractedReceipt, Receipt } from "@/lib/types";

type Status = "idle" | "scanning" | "review" | "saving" | "error";
type Source = "ai" | "local" | "manual" | null;

const LOAN_TENURE_OPTIONS = [1, 3, 6, 12, 24, 36];

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
  loanTenureMonths: number | null;
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
    loanTenureMonths: null,
  };
}

export default function UploadReceipt({
  onSaved,
  onQueued,
}: {
  onSaved: (receipt: Receipt) => void;
  onQueued?: () => void;
}) {
  const { lang, t } = useLanguage();
  const online = useOnlineStatus();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [source, setSource] = useState<Source>(null);
  const [showMore, setShowMore] = useState(false);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitTotal, setSplitTotal] = useState("");
  const [splitPeople, setSplitPeople] = useState("2");
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const manualCameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(selectedFile: File) {
    setError(null);
    setStatus("scanning");
    setFile(selectedFile);

    const dataUrl = await fileToDataUrl(selectedFile);
    setPreview(dataUrl);

    // Load-balance: try the AI scan only if we appear to be online; if the
    // AI call fails for any reason (quota, network blip, server error),
    // fall back to fully local OCR so scanning still works.
    if (online) {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetch("/api/scan", { method: "POST", body: formData });
        const json = (await res.json()) as { extracted?: ExtractedReceipt; error?: string };

        if (!res.ok || !json.extracted) {
          throw new Error(json.error || "AI scan failed");
        }

        setDraft(draftFromExtracted(json.extracted));
        setSource("ai");
        setStatus("review");
        return;
      } catch {
        // fall through to local OCR below
      }
    }

    try {
      const extracted = await extractReceiptLocally(selectedFile);
      setDraft(draftFromExtracted(extracted));
      setSource("local");
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

  async function handleManualFile(selectedFile: File) {
    setError(null);
    setFile(selectedFile);
    const dataUrl = await fileToDataUrl(selectedFile);
    setPreview(dataUrl);
    setDraft({
      merchant: "",
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      subcategory: "uncategorized",
      reliefCategory: null,
      isEInvoice: false,
      type: "expense",
      paymentMethod: "",
      accountName: "",
      tags: "",
      isRecurring: false,
      location: "",
      loanTenureMonths: null,
    });
    setSource("manual");
    setStatus("review");
  }

  function onManualInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleManualFile(selected);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  }

  async function buildFormData(): Promise<FormData> {
    if (!draft) throw new Error("No draft to save.");
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
    if (draft.loanTenureMonths) formData.append("loanTenureMonths", String(draft.loanTenureMonths));
    if (file) formData.append("file", file);
    return formData;
  }

  async function queueForLaterSync() {
    if (!draft) return;
    try {
      await addPendingReceipt({
        merchant: draft.merchant,
        date: draft.date,
        amount: draft.amount,
        subcategory: draft.subcategory,
        reliefCategory: draft.reliefCategory,
        type: draft.type,
        paymentMethod: draft.paymentMethod,
        accountName: draft.accountName,
        tags: draft.tags,
        isRecurring: draft.isRecurring,
        location: draft.location,
        isEInvoice: draft.isEInvoice,
        loanTenureMonths: draft.loanTenureMonths,
        imageDataUrl: preview,
        imageType: file?.type ?? null,
      });
      onQueued?.();
      reset();
    } catch (queueErr) {
      setError(queueErr instanceof Error ? queueErr.message : "Failed to save receipt.");
      setStatus("error");
    }
  }

  async function handleSave() {
    if (!draft) return;
    setStatus("saving");
    setError(null);

    // Genuinely offline — no point attempting the request, queue straight away.
    if (!online) {
      await queueForLaterSync();
      return;
    }

    try {
      const formData = await buildFormData();
      const res = await fetch("/api/receipts", { method: "POST", body: formData });

      if (res.ok) {
        const json = (await res.json()) as { receipt: Receipt };
        onSaved(json.receipt);
        reset();
        return;
      }

      // The server was reachable and responded — this is a real error
      // (validation, auth, quota, etc.), not a connectivity problem, so
      // surface it instead of silently misfiling it as "offline, will
      // sync later" where it would just fail again on every retry.
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setError(json.error || "Failed to save receipt.");
      setStatus("error");
    } catch {
      // fetch() itself threw — the request never reached the server
      // (connection dropped, DNS failure, etc.), so this is the one case
      // worth queuing for automatic retry once back online.
      await queueForLaterSync();
    }
  }

  function reset() {
    setStatus("idle");
    setError(null);
    setPreview(null);
    setFile(null);
    setDraft(null);
    setSource(null);
    setShowMore(false);
    setSplitEnabled(false);
    setSplitTotal("");
    setSplitPeople("2");
    if (inputRef.current) inputRef.current.value = "";
  }

  const splitShare =
    splitTotal && Number(splitPeople) > 0 ? Number(splitTotal) / Number(splitPeople) : 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={onInputChange}
      />
      <input
        ref={manualInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onManualInputChange}
      />
      <input
        ref={manualCameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={onManualInputChange}
      />

      {status === "idle" && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border"
            }`}
          >
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-2xl">
              📷
            </span>
            <p className="text-sm font-medium">{t("upload.drop")}</p>
            <p className="mt-1 text-xs text-muted">{t("upload.hint")}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn-pill btn-pill-outline btn-pill-sm"
              >
                🖼️ {t("upload.chooseGallery")}
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="btn-pill btn-pill-outline btn-pill-sm"
              >
                📷 {t("upload.takePhoto")}
              </button>
            </div>
            {!online && (
              <p className="mt-2 text-xs text-amber-300">{t("upload.offlineNotice")}</p>
            )}
          </div>
          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("upload.manualAdd")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => manualInputRef.current?.click()}
                className="btn-pill btn-pill-outline btn-pill-sm"
              >
                🖼️ {t("upload.chooseGallery")}
              </button>
              <button
                type="button"
                onClick={() => manualCameraInputRef.current?.click()}
                className="btn-pill btn-pill-outline btn-pill-sm"
              >
                📷 {t("upload.takePhoto")}
              </button>
            </div>
            <p className="max-w-sm text-xs text-muted">{t("upload.manualHint")}</p>
          </div>
        </>
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
            {online ? t("upload.scanning") : t("upload.scanningLocal")}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={reset} className="btn-pill btn-pill-outline">
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
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {t("upload.review")}
              </p>
              {source && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    source === "ai"
                      ? "bg-accent/15 text-accent"
                      : source === "local"
                        ? "bg-amber-400/15 text-amber-300"
                        : "bg-indigo-400/15 text-indigo-300"
                  }`}
                >
                  {source === "ai"
                    ? t("upload.sourceAi")
                    : source === "local"
                      ? t("upload.sourceLocal")
                      : t("upload.sourceManual")}
                </span>
              )}
            </div>

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
                  onFocus={(e) => e.target.select()}
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

                <label className="text-xs text-muted">
                  {t("upload.loanTenure")}
                  <select
                    value={draft.loanTenureMonths ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        loanTenureMonths: e.target.value ? Number(e.target.value) : null,
                        isRecurring: e.target.value ? true : draft.isRecurring,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                  >
                    <option value="">{t("upload.loanTenureNone")}</option>
                    {LOAN_TENURE_OPTIONS.map((months) => (
                      <option key={months} value={months}>
                        {months} {t("upload.months")}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-lg border border-border bg-surface p-3">
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={splitEnabled}
                      onChange={(e) => setSplitEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-cyan-400"
                    />
                    {t("upload.splitEnable")}
                  </label>

                  {splitEnabled && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="text-xs text-muted">
                        {t("upload.splitTotal")}
                        <input
                          type="number"
                          step="0.01"
                          value={splitTotal}
                          onChange={(e) => setSplitTotal(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                        />
                      </label>
                      <label className="text-xs text-muted">
                        {t("upload.splitPeople")}
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={splitPeople}
                          onChange={(e) => setSplitPeople(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                        />
                      </label>

                      <div className="col-span-2 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                        <span className="text-muted">{t("upload.splitShare")}</span>
                        <span className="font-semibold text-accent">RM {splitShare.toFixed(2)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setDraft({ ...draft, amount: Math.round(splitShare * 100) / 100 })
                        }
                        disabled={splitShare <= 0}
                        className="btn-pill btn-pill-outline btn-pill-sm col-span-2"
                      >
                        {t("upload.splitUse")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-2 flex gap-3">
              <button
                onClick={handleSave}
                disabled={status === "saving"}
                className="btn-pill btn-pill-primary flex-1"
              >
                {status === "saving" ? t("upload.saving") : t("upload.save")}
              </button>
              <button
                onClick={reset}
                disabled={status === "saving"}
                className="btn-pill btn-pill-outline"
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
