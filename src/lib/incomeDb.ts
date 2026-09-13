import { getCfEnv } from "./cloudflare";
import type { IncomeEntry } from "./types";

interface IncomeEntryRow {
  id: string;
  year: number;
  month: number;
  amount: number;
  income_type: string;
  label: string | null;
}

function rowToEntry(r: IncomeEntryRow): IncomeEntry {
  return {
    id: r.id,
    year: r.year,
    month: r.month,
    amount: r.amount,
    incomeType: r.income_type,
    label: r.label,
  };
}

/**
 * Lists income entries for a user, optionally scoped to a year and/or
 * month. Omitting both returns every entry the user has ever recorded —
 * used by the dashboard so features spanning multiple months (e.g. a
 * yearly cash-flow summary) see the same data as the monthly tracker.
 */
export async function listIncomeEntries(
  userId: string,
  year?: number,
  month?: number
): Promise<IncomeEntry[]> {
  const env = await getCfEnv();
  let query = "SELECT id, year, month, amount, income_type, label FROM income_entries WHERE user_id = ?";
  const binds: (string | number)[] = [userId];

  if (year !== undefined) {
    query += " AND year = ?";
    binds.push(year);
  }
  if (month !== undefined) {
    query += " AND month = ?";
    binds.push(month);
  }
  query += " ORDER BY year ASC, month ASC, created_at ASC";

  const { results } = await env.DB.prepare(query)
    .bind(...binds)
    .all<IncomeEntryRow>();

  return results.map(rowToEntry);
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
