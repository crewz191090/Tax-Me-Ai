import { getCfEnv } from "./cloudflare";

export interface Budget {
  id: string;
  mainCategory: string;
  monthlyLimit: number;
}

interface BudgetRow {
  id: string;
  main_category: string;
  monthly_limit: number;
}

export async function listBudgets(userId: string): Promise<Budget[]> {
  const env = await getCfEnv();
  const { results } = await env.DB.prepare(
    "SELECT id, main_category, monthly_limit FROM budgets WHERE user_id = ?"
  )
    .bind(userId)
    .all<BudgetRow>();

  return results.map((r) => ({
    id: r.id,
    mainCategory: r.main_category,
    monthlyLimit: r.monthly_limit,
  }));
}

export async function upsertBudget(
  userId: string,
  mainCategory: string,
  monthlyLimit: number
): Promise<void> {
  const env = await getCfEnv();
  const id = `budget_${userId}_${mainCategory}`;

  await env.DB.prepare(
    `INSERT INTO budgets (id, user_id, main_category, monthly_limit, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, main_category) DO UPDATE SET monthly_limit = excluded.monthly_limit`
  )
    .bind(id, userId, mainCategory, monthlyLimit, new Date().toISOString())
    .run();
}

export async function deleteBudget(userId: string, mainCategory: string): Promise<void> {
  const env = await getCfEnv();
  await env.DB.prepare("DELETE FROM budgets WHERE user_id = ? AND main_category = ?")
    .bind(userId, mainCategory)
    .run();
}
