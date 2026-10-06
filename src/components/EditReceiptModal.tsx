"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  EXPENSE_CATEGORIES,
  LOAN_TENURE_OPTIONS,
  PAYMENT_METHODS,
  type TransactionType,
} from "@/lib/expenseCategories";
import { RELIEF_CATEGORIES, getReliefCategory } from "@/lib/reliefCategories";
import type { Receipt } from "@/lib/types";

export type ReceiptPatch = Partial<
  Pick<
    Receipt,
    | "merchant"
    | "date"
    | "amount"
    | "subcategory"
    | "reliefCategory"
    | "type"
    | "paymentMethod"
    | "accountName"
    | "tags"
    | "location"
    | "isRecurring"
    | "loanTenureMonths"
    | "loanMonthIndex"
  >
>;

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export default function EditReceiptModal({
  receipt,
  onSave,
  onClose,
}: {
  receipt: Receipt;
  /** Resolves when saved; rejects with an Error whose message is shown to the user. */
  onSave: (patch: ReceiptPatch) => Promise<void>;
  onClose: () => void;
}) {
  const { lang, t } = useLanguage();
  const [merchant, setMerchant] = useState(receipt.merchant);
  const [date, setDate] = useState(receipt.date);
  const [amountText, setAmountText] = useState(receipt.amount.toFixed(2));
  const [subcategory, setSubcategory] = useState(receipt.subcategory);
  const [type, setType] = useState<TransactionType>(receipt.type);
  const [reliefCategory, setReliefCategory] = useState(receipt.reliefCategory ?? "");
  const [paymentMethod, setPaymentMethod] = useState(receipt.paymentMethod ?? "");
  const [accountName, setAccountName] = useState(receipt.accountName ?? "");
  const [tags, setTags] = useState(receipt.tags ?? "");
  const [location, setLocation] = useState(receipt.location ?? "");
  const [isRecurring, setIsRecurring] = useState(receipt.isRecurring);
  const [loanTenureMonths, setLoanTenureMonths] = useState<number | null>(
    receipt.loanTenureMonths ?? null
  );
  const [showMore, setShowMore] = useState(
    Boolean(
      receipt.paymentMethod ||
        receipt.accountName ||
        receipt.tags ||
        receipt.location ||
        receipt.isRecurring ||
        receipt.loanTenureMonths
    )
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const isExpense = type === "expense";

  function buildPatch(amount: number): ReceiptPatch {
    const patch: ReceiptPatch = {};
    if (merchant.trim() !== receipt.merchant) patch.merchant = merchant.trim();
    if (date !== receipt.date) patch.date = date;
    if (amount !== receipt.amount) patch.amount = amount;
    if (subcategory !== receipt.subcategory) patch.subcategory = subcategory;
    if (type !== receipt.type) patch.type = type;

    // Only expenses carry a tax relief category — leaving one on an
    // income/transfer would wrongly count it toward the claimable total.
    const nextRelief = isExpense ? emptyToNull(reliefCategory) : null;
    if (nextRelief !== (receipt.reliefCategory ?? null)) patch.reliefCategory = nextRelief;

    if (emptyToNull(paymentMethod) !== (receipt.paymentMethod ?? null)) {
      patch.paymentMethod = emptyToNull(paymentMethod);
    }
    if (emptyToNull(accountName) !== (receipt.accountName ?? null)) {
      patch.accountName = emptyToNull(accountName);
    }
    if (emptyToNull(tags) !== (receipt.tags ?? null)) patch.tags = emptyToNull(tags);
    if (emptyToNull(location) !== (receipt.location ?? null)) {
      patch.location = emptyToNull(location);
    }
    if (isRecurring !== receipt.isRecurring) patch.isRecurring = isRecurring;

    if (loanTenureMonths !== (receipt.loanTenureMonths ?? null)) {
      patch.loanTenureMonths = loanTenureMonths;
      patch.loanMonthIndex = loanTenureMonths ? (receipt.loanMonthIndex ?? 1) : null;
    }
    return patch;
  }

  async function handleSave() {
    const amount = parseFloat(amountText);
    if (!merchant.trim()) return setError(t("upload.errorMerchant"));
    if (!date) return setError(t("upload.errorDate"));
    if (!amount || amount <= 0) return setError(t("upload.errorAmount"));

    const patch = buildPatch(amount);
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave(patch);
      onClose();
    } catch (err) {
      setError(t("edit.saveFailed").replace("{error}", err instanceof Error ? err.message : String(err)));
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={() => !saving && onClose()}
    >
      <div
        className="glass glow-border max-h-[92vh] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-5 py-4 backdrop-blur">
          <span className="text-sm font-semibold">{t("edit.title")}</span>
          <button
            onClick={onClose}
            disabled={saving}
            aria-label={t("image.close")}
            className="rounded-full border border-border p-1.5 text-muted hover:bg-surface-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <label className="text-xs text-muted">
            {t("upload.type")}
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className={inputClass}
            >
              <option value="expense">{t("upload.typeExpense")}</option>
              <option value="income">{t("upload.typeIncome")}</option>
              <option value="transfer">{t("upload.typeTransfer")}</option>
            </select>
          </label>

          <label className="text-xs text-muted">
            {t("upload.merchant")}
            <input value={merchant} onChange={(e) => setMerchant(e.target.value)} className={inputClass} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-muted">
              {t("upload.date")}
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </label>
            <label className="text-xs text-muted">
              {t("upload.amount")}
              <input
                type="text"
                inputMode="decimal"
                value={amountText}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmountText(v);
                }}
                onFocus={(e) => e.target.select()}
                onBlur={() => setAmountText((parseFloat(amountText) || 0).toFixed(2))}
                className={inputClass}
              />
            </label>
          </div>

          <label className="text-xs text-muted">
            {t("upload.subcategory")}
            <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className={inputClass}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <optgroup key={cat.id} label={`${cat.emoji} ${lang === "bm" ? cat.nameBm : cat.nameEn}`}>
                  {cat.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {lang === "bm" ? sub.nameBm : sub.nameEn}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          {isExpense && (
            <>
              <label className="text-xs text-muted">
                {t("upload.reliefCategory")}
                <select
                  value={reliefCategory}
                  onChange={(e) => setReliefCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t("upload.reliefNone")}</option>
                  {RELIEF_CATEGORIES.filter((c) => c.cap > 0).map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === "bm" ? c.nameBm : c.nameEn}
                    </option>
                  ))}
                </select>
              </label>
              {reliefCategory && (
                <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="text-muted">{t("upload.annualCap")}</span>
                  <span className="font-semibold text-accent">
                    RM {getReliefCategory(reliefCategory).cap.toLocaleString()}
                  </span>
                </div>
              )}
            </>
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
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
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
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder={t("upload.accountPlaceholder")}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="text-xs text-muted">
                {t("upload.tags")}
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t("upload.tagsPlaceholder")}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-muted">
                {t("upload.location")}
                <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
              </label>

              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-cyan-400"
                />
                {t("upload.recurring")}
              </label>

              <label className="text-xs text-muted">
                {t("upload.loanTenure")}
                <select
                  value={loanTenureMonths ?? ""}
                  onChange={(e) => {
                    const next = e.target.value ? Number(e.target.value) : null;
                    setLoanTenureMonths(next);
                    if (next) setIsRecurring(true);
                  }}
                  className={inputClass}
                >
                  <option value="">{t("upload.loanTenureNone")}</option>
                  {LOAN_TENURE_OPTIONS.map((months) => (
                    <option key={months} value={months}>
                      {months} {t("upload.months")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {error && (
            <p className="break-words rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
          )}

          <div className="mt-1 flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-pill btn-pill-primary flex-1">
              {saving ? t("upload.saving") : t("upload.save")}
            </button>
            <button onClick={onClose} disabled={saving} className="btn-pill btn-pill-outline">
              {t("upload.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
