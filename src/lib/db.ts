import { getCfEnv } from "./cloudflare";
import { rowToReceipt, type Receipt, type ReceiptRow } from "./types";

export async function listReceipts(userId: string): Promise<Receipt[]> {
  const env = await getCfEnv();
  const { results } = await env.DB.prepare(
    "SELECT * FROM receipts WHERE user_id = ? ORDER BY date DESC, created_at DESC"
  )
    .bind(userId)
    .all<ReceiptRow>();
  return results.map(rowToReceipt);
}

export async function insertReceipt(userId: string, receipt: Receipt): Promise<void> {
  const env = await getCfEnv();
  await env.DB.prepare(
    `INSERT INTO receipts
      (id, user_id, merchant, date, amount, main_category, subcategory, relief_category,
       type, payment_method, account_name, tags, is_recurring, location,
       notes, image_key, is_e_invoice, loan_tenure_months, loan_month_index, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      receipt.id,
      userId,
      receipt.merchant,
      receipt.date,
      receipt.amount,
      receipt.mainCategory,
      receipt.subcategory,
      receipt.reliefCategory,
      receipt.type,
      receipt.paymentMethod ?? null,
      receipt.accountName ?? null,
      receipt.tags ?? null,
      receipt.isRecurring ? 1 : 0,
      receipt.location ?? null,
      receipt.notes ?? null,
      receipt.imageKey ?? null,
      receipt.isEInvoice ? 1 : 0,
      receipt.loanTenureMonths ?? null,
      receipt.loanMonthIndex ?? null,
      receipt.createdAt
    )
    .run();
}

export async function updateReceiptFields(
  userId: string,
  id: string,
  updates: Partial<
    Pick<
      Receipt,
      | "merchant"
      | "date"
      | "amount"
      | "mainCategory"
      | "subcategory"
      | "reliefCategory"
      | "type"
      | "paymentMethod"
      | "accountName"
      | "tags"
      | "isRecurring"
      | "location"
      | "notes"
      | "loanTenureMonths"
      | "loanMonthIndex"
    >
  >
): Promise<void> {
  const env = await getCfEnv();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  const columnMap: Record<string, string> = {
    merchant: "merchant",
    date: "date",
    amount: "amount",
    mainCategory: "main_category",
    subcategory: "subcategory",
    reliefCategory: "relief_category",
    type: "type",
    paymentMethod: "payment_method",
    accountName: "account_name",
    tags: "tags",
    isRecurring: "is_recurring",
    location: "location",
    notes: "notes",
    loanTenureMonths: "loan_tenure_months",
    loanMonthIndex: "loan_month_index",
  };

  for (const [key, column] of Object.entries(columnMap)) {
    const value = (updates as Record<string, unknown>)[key];
    if (value === undefined) continue;
    fields.push(`${column} = ?`);
    if (key === "isRecurring") {
      values.push(value ? 1 : 0);
    } else {
      values.push(value as string | number | null);
    }
  }

  if (fields.length === 0) return;

  values.push(id, userId);
  await env.DB.prepare(
    `UPDATE receipts SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`
  )
    .bind(...values)
    .run();
}

export async function getReceiptImageKey(userId: string, id: string): Promise<string | null> {
  const env = await getCfEnv();
  const row = await env.DB.prepare(
    "SELECT image_key FROM receipts WHERE id = ? AND user_id = ?"
  )
    .bind(id, userId)
    .first<{ image_key: string | null }>();
  return row?.image_key ?? null;
}

export async function deleteReceiptById(userId: string, id: string): Promise<string | null> {
  const env = await getCfEnv();
  const row = await env.DB.prepare(
    "SELECT image_key FROM receipts WHERE id = ? AND user_id = ?"
  )
    .bind(id, userId)
    .first<{ image_key: string | null }>();

  await env.DB.prepare("DELETE FROM receipts WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run();

  return row?.image_key ?? null;
}

export function newReceiptId(): string {
  return `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
