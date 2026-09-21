import { RELIEF_CATEGORIES, getReliefCategory } from "./reliefCategories";
import { getExpenseCategory, getSubcategory } from "./expenseCategories";
import type { Receipt } from "./types";

export interface ReliefRow {
  categoryId: string;
  nameEn: string;
  nameBm: string;
  cap: number;
  spent: number;
  claimable: number;
  remaining: number;
}

export interface ReliefSummary {
  year: number;
  rows: ReliefRow[];
  totalSpent: number;
  totalClaimable: number;
}

export interface ReliefAlert {
  categoryId: string;
  nameEn: string;
  nameBm: string;
  level: "full" | "warning";
  pct: number;
  spent: number;
  cap: number;
}

/**
 * Categories that are fully claimed (spent >= cap) or close to it (>= 80%)
 * — surfaced as in-app notifications so the user knows before they overspend
 * into a category that no longer yields any extra tax relief.
 */
export function getReliefAlerts(rows: ReliefRow[]): ReliefAlert[] {
  return rows
    .filter((r) => r.spent > 0)
    .map((r) => ({
      categoryId: r.categoryId,
      nameEn: r.nameEn,
      nameBm: r.nameBm,
      pct: (r.spent / r.cap) * 100,
      spent: r.spent,
      cap: r.cap,
      level: (r.spent >= r.cap ? "full" : "warning") as "full" | "warning",
    }))
    .filter((a) => a.pct >= 80)
    .sort((a, b) => b.pct - a.pct);
}

export function yearsWithReceipts(receipts: Receipt[]): number[] {
  const years = new Set(receipts.map((r) => Number(r.date.slice(0, 4))));
  return Array.from(years).sort((a, b) => b - a);
}

export function computeReliefSummary(
  receipts: Receipt[],
  year: number,
  month?: number | null
): ReliefSummary {
  const spentByCategory = new Map<string, number>();

  for (const receipt of receipts) {
    if (!receipt.reliefCategory) continue;
    const receiptYear = Number(receipt.date.slice(0, 4));
    if (receiptYear !== year) continue;
    if (month != null) {
      const receiptMonth = Number(receipt.date.slice(5, 7));
      if (receiptMonth !== month) continue;
    }
    const current = spentByCategory.get(receipt.reliefCategory) ?? 0;
    spentByCategory.set(receipt.reliefCategory, current + receipt.amount);
  }

  const rows: ReliefRow[] = RELIEF_CATEGORIES.filter((c) => c.cap > 0).map(
    (category) => {
      const spent = spentByCategory.get(category.id) ?? 0;
      const claimable = Math.min(spent, category.cap);
      return {
        categoryId: category.id,
        nameEn: category.nameEn,
        nameBm: category.nameBm,
        cap: category.cap,
        spent,
        claimable,
        remaining: Math.max(category.cap - spent, 0),
      };
    }
  );

  const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0);
  const totalClaimable = rows.reduce((sum, r) => sum + r.claimable, 0);

  return { year, rows, totalSpent, totalClaimable };
}

export function claimableForReceipt(receipt: Receipt): number {
  if (!receipt.reliefCategory) return 0;
  const cap = getReliefCategory(receipt.reliefCategory).cap;
  return cap > 0 ? receipt.amount : 0;
}

/**
 * All tax-deductible receipts for a given assessment year, sorted oldest
 * first — this is the row-level detail behind the relief summary, used for
 * the yearly tax table and the LHDN-ready PDF/CSV exports.
 */
export function yearlyDeductibleReceipts(receipts: Receipt[], year: number): Receipt[] {
  return receipts
    .filter((r) => {
      if (!r.reliefCategory) return false;
      if (getReliefCategory(r.reliefCategory).cap <= 0) return false;
      return Number(r.date.slice(0, 4)) === year;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface YearlyCategoryGroup {
  categoryId: string;
  nameEn: string;
  nameBm: string;
  receipts: Receipt[];
  totalClaimable: number;
}

/**
 * The same yearly deductible receipts as `yearlyDeductibleReceipts`, but
 * bucketed by relief category (in the official LHDN category order) —
 * powers the grouped table and PDF export so a claim can be checked
 * category by category rather than as one long date-sorted list.
 */
export function groupYearlyDeductibleReceiptsByCategory(
  receipts: Receipt[],
  year: number
): YearlyCategoryGroup[] {
  const yearReceipts = yearlyDeductibleReceipts(receipts, year);
  const byCategory = new Map<string, Receipt[]>();

  for (const receipt of yearReceipts) {
    const categoryId = receipt.reliefCategory as string;
    const existing = byCategory.get(categoryId);
    if (existing) {
      existing.push(receipt);
    } else {
      byCategory.set(categoryId, [receipt]);
    }
  }

  const groups: YearlyCategoryGroup[] = [];
  for (const category of RELIEF_CATEGORIES) {
    const categoryReceipts = byCategory.get(category.id);
    if (!categoryReceipts || categoryReceipts.length === 0) continue;
    groups.push({
      categoryId: category.id,
      nameEn: category.nameEn,
      nameBm: category.nameBm,
      receipts: categoryReceipts,
      totalClaimable: categoryReceipts.reduce((sum, r) => sum + claimableForReceipt(r), 0),
    });
  }

  return groups;
}

export type Period =
  | { type: "month"; year: number; month: number } // month: 1-12
  | { type: "year"; year: number };

export function receiptInPeriod(receipt: Receipt, period: Period): boolean {
  const receiptYear = Number(receipt.date.slice(0, 4));
  if (receiptYear !== period.year) return false;
  if (period.type === "month") {
    const receiptMonth = Number(receipt.date.slice(5, 7));
    return receiptMonth === period.month;
  }
  return true;
}

export interface CategoryBreakdownRow {
  categoryId: string;
  nameEn: string;
  nameBm: string;
  emoji: string;
  amount: number;
  isDeductible: boolean;
}

/**
 * Spending grouped by main expense category for a given period — this
 * powers the general expense-tracking view, independent of tax relief.
 * Only `type: "expense"` receipts are included (income/transfers excluded).
 */
export function computeCategoryBreakdown(
  receipts: Receipt[],
  period: Period
): CategoryBreakdownRow[] {
  const amountByCategory = new Map<string, number>();
  const deductibleByCategory = new Map<string, boolean>();

  for (const receipt of receipts) {
    if (receipt.type !== "expense") continue;
    if (!receiptInPeriod(receipt, period)) continue;
    const current = amountByCategory.get(receipt.mainCategory) ?? 0;
    amountByCategory.set(receipt.mainCategory, current + receipt.amount);
    if (receipt.reliefCategory) {
      deductibleByCategory.set(receipt.mainCategory, true);
    }
  }

  const rows: CategoryBreakdownRow[] = [];
  for (const [categoryId, amount] of amountByCategory) {
    const category = getExpenseCategory(categoryId);
    rows.push({
      categoryId,
      nameEn: category.nameEn,
      nameBm: category.nameBm,
      emoji: category.emoji,
      amount,
      isDeductible: deductibleByCategory.get(categoryId) ?? false,
    });
  }

  return rows.sort((a, b) => b.amount - a.amount);
}

export interface TrendPoint {
  label: string;
  key: number;
  total: number;
}

const MONTH_KEYS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_KEYS_BM = [
  "Jan", "Feb", "Mac", "Apr", "Mei", "Jun",
  "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis",
];

export function computeMonthlyTrend(
  receipts: Receipt[],
  year: number,
  lang: "en" | "bm" = "en"
): TrendPoint[] {
  const totals = new Array(12).fill(0) as number[];

  for (const receipt of receipts) {
    if (receipt.type !== "expense") continue;
    const receiptYear = Number(receipt.date.slice(0, 4));
    if (receiptYear !== year) continue;
    const monthIndex = Number(receipt.date.slice(5, 7)) - 1;
    if (monthIndex < 0 || monthIndex > 11) continue;
    totals[monthIndex] += receipt.amount;
  }

  const labels = lang === "bm" ? MONTH_KEYS_BM : MONTH_KEYS_EN;
  return totals.map((total, i) => ({ label: labels[i], key: i + 1, total }));
}

export function computeYearlyTrend(receipts: Receipt[]): TrendPoint[] {
  const totals = new Map<number, number>();

  for (const receipt of receipts) {
    if (receipt.type !== "expense") continue;
    const year = Number(receipt.date.slice(0, 4));
    totals.set(year, (totals.get(year) ?? 0) + receipt.amount);
  }

  return Array.from(totals.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, total]) => ({ label: String(year), key: year, total }));
}

export { getSubcategory };
