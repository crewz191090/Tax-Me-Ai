import { RELIEF_CATEGORIES, getReliefCategory } from "./reliefCategories";
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

export function yearsWithReceipts(receipts: Receipt[]): number[] {
  const years = new Set(receipts.map((r) => Number(r.date.slice(0, 4))));
  return Array.from(years).sort((a, b) => b - a);
}

export function computeReliefSummary(
  receipts: Receipt[],
  year: number
): ReliefSummary {
  const spentByCategory = new Map<string, number>();

  for (const receipt of receipts) {
    const receiptYear = Number(receipt.date.slice(0, 4));
    if (receiptYear !== year) continue;
    const current = spentByCategory.get(receipt.category) ?? 0;
    spentByCategory.set(receipt.category, current + receipt.amount);
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
  const cap = getReliefCategory(receipt.category).cap;
  return cap > 0 ? receipt.amount : 0;
}
