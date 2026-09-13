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
      (id, user_id, merchant, date, amount, category, notes, image_key, is_e_invoice, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      receipt.id,
      userId,
      receipt.merchant,
      receipt.date,
      receipt.amount,
      receipt.category,
      receipt.notes ?? null,
      receipt.imageKey ?? null,
      receipt.isEInvoice ? 1 : 0,
      receipt.createdAt
    )
    .run();
}

export async function updateReceiptFields(
  userId: string,
  id: string,
  updates: Partial<Pick<Receipt, "merchant" | "date" | "amount" | "category" | "notes">>
): Promise<void> {
  const env = await getCfEnv();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.merchant !== undefined) {
    fields.push("merchant = ?");
    values.push(updates.merchant);
  }
  if (updates.date !== undefined) {
    fields.push("date = ?");
    values.push(updates.date);
  }
  if (updates.amount !== undefined) {
    fields.push("amount = ?");
    values.push(updates.amount);
  }
  if (updates.category !== undefined) {
    fields.push("category = ?");
    values.push(updates.category);
  }
  if (updates.notes !== undefined) {
    fields.push("notes = ?");
    values.push(updates.notes);
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
