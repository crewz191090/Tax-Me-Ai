import { getCfEnv } from "./cloudflare";

export interface IncomeEntry {
  id: string;
  year: number;
  month: number;
  amount: number;
  incomeType: string;
  label: string | null;
}

interface IncomeEntryRow {
  id: string;
  year: number;
  month: number;
  amount: number;
  income_type: string;
  label: string | null;
}

export async function listIncomeEntries(
  userId: string,
  year: number,
  month: number
): Promise<IncomeEntry[]> {
  const env = await getCfEnv();
  const { results } = await env.DB.prepare(
    "SELECT id, year, month, amount, income_type, label FROM income_entries WHERE user_id = ? AND year = ? AND month = ? ORDER BY created_at ASC"
  )
    .bind(userId, year, month)
    .all<IncomeEntryRow>();

  return results.map((r) => ({
    id: r.id,
    year: r.year,
    month: r.month,
    amount: r.amount,
    incomeType: r.income_type,
    label: r.label,
  }));
}

export async function createIncomeEntry(
  userId: string,
  year: number,
  month: number,
  amount: number,
  incomeType: string,
  label: string | null
): Promise<string> {
  const env = await getCfEnv();
  const id = `income_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await env.DB.prepare(
    `INSERT INTO income_entries (id, user_id, year, month, amount, income_type, label, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, userId, year, month, amount, incomeType, label, new Date().toISOString())
    .run();

  return id;
}

export async function updateIncomeEntry(
  userId: string,
  id: string,
  amount: number,
  incomeType: string,
  label: string | null
): Promise<void> {
  const env = await getCfEnv();
  await env.DB.prepare(
    "UPDATE income_entries SET amount = ?, income_type = ?, label = ? WHERE id = ? AND user_id = ?"
  )
    .bind(amount, incomeType, label, id, userId)
    .run();
}

export async function deleteIncomeEntry(userId: string, id: string): Promise<void> {
  const env = await getCfEnv();
  await env.DB.prepare("DELETE FROM income_entries WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run();
}
