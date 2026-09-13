import type { Category } from "./categories";

export interface Receipt {
  id: string;
  merchant: string;
  date: string; // ISO yyyy-mm-dd
  amount: number;
  category: Category | string;
  deductiblePercent: number;
  notes?: string;
  imageKey?: string | null;
  isEInvoice: boolean;
  createdAt: string;
}

export interface ExtractedReceipt {
  merchant: string;
  date: string;
  amount: number;
  category: string;
  isEInvoice?: boolean;
}

export interface ReceiptRow {
  id: string;
  merchant: string;
  date: string;
  amount: number;
  category: string;
  deductible_percent: number;
  notes: string | null;
  image_key: string | null;
  is_e_invoice: number;
  created_at: string;
}

export function rowToReceipt(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    merchant: row.merchant,
    date: row.date,
    amount: row.amount,
    category: row.category,
    deductiblePercent: row.deductible_percent,
    notes: row.notes ?? undefined,
    imageKey: row.image_key,
    isEInvoice: Boolean(row.is_e_invoice),
    createdAt: row.created_at,
  };
}
