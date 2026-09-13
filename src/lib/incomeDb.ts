import { getCfEnv } from "./cloudflare";

export interface MonthlyIncome {
  year: number;
  month: number;
  amount: number;
  incomeType: string;
}

interface MonthlyIncomeRow {
  year: number;
  month: number;
  amount: number;
  income_type: string;
}

export async function getMonthlyIncome(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyIncome | null> {
  const env = await getCfEnv();
  const row = await env.DB.prepare(
    "SELECT year, month, amount, income_type FROM monthly_income WHERE user_id = ? AND year = ? AND month = ?"
  )
    .bind(userId, year, month)
    .first<MonthlyIncomeRow>();

  if (!row) return null;
  return { year: row.year, month: row.month, amount: row.amount, incomeType: row.income_type };
}

export async function upsertMonthlyIncome(
  userId: string,
  year: number,
  month: number,
  amount: number,
  incomeType: string
): Promise<void> {
  const env = await getCfEnv();
  const id = `income_${userId}_${year}_${month}`;

  await env.DB.prepare(
    `INSERT INTO monthly_income (id, user_id, year, month, amount, income_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, year, month) DO UPDATE SET amount = excluded.amount, income_type = excluded.income_type`
  )
    .bind(id, userId, year, month, amount, incomeType, new Date().toISOString())
    .run();
}

export async function deleteMonthlyIncome(userId: string, year: number, month: number): Promise<void> {
  const env = await getCfEnv();
  await env.DB.prepare("DELETE FROM monthly_income WHERE user_id = ? AND year = ? AND month = ?")
    .bind(userId, year, month)
    .run();
}
