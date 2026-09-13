import type { TransactionType } from "./expenseCategories";

export interface Receipt {
  id: string;
  merchant: string;
  date: string; // ISO yyyy-mm-dd
  amount: number;
  mainCategory: string;
  subcategory: string;
  reliefCategory: string | null;
  type: TransactionType;
  paymentMethod?: string | null;
  accountName?: string | null;
  tags?: string | null;
  isRecurring: boolean;
  location?: string | null;
  notes?: string;
  imageKey?: string | null;
  isEInvoice: boolean;
  createdAt: string;
}

export interface IncomeEntry {
  id: string;
  year: number;
  month: number;
  amount: number;
  incomeType: string;
  label: string | null;
}

export interface ExtractedReceipt {
  merchant: string;
  date: string;
  amount: number;
  subcategory: string;
  reliefCategory: string | null;
  isEInvoice?: boolean;
}

export interface ReceiptRow {
  id: string;
  merchant: string;
  date: string;
  amount: number;
  main_category: string;
  subcategory: string;
  relief_category: string | null;
  type: string;
  payment_method: string | null;
  account_name: string | null;
  tags: string | null;
  is_recurring: number;
  location: string | null;
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
    mainCategory: row.main_category,
    subcategory: row.subcategory,
    reliefCategory: row.relief_category,
    type: (row.type as TransactionType) ?? "expense",
    paymentMethod: row.payment_method,
    accountName: row.account_name,
    tags: row.tags,
    isRecurring: Boolean(row.is_recurring),
    location: row.location,
    notes: row.notes ?? undefined,
    imageKey: row.image_key,
    isEInvoice: Boolean(row.is_e_invoice),
    createdAt: row.created_at,
  };
}
