import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listBudgets, upsertBudget } from "@/lib/budgetsDb";
import { EXPENSE_CATEGORIES } from "@/lib/expenseCategories";

export const runtime = "nodejs";

const MAIN_CATEGORY_IDS = EXPENSE_CATEGORIES.map((c) => c.id);

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const budgets = await listBudgets(user.id);
    return NextResponse.json({ budgets });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { mainCategory?: string; monthlyLimit?: number };
    const mainCategory = body.mainCategory ?? "";
    const monthlyLimit = body.monthlyLimit ?? 0;

    if (!MAIN_CATEGORY_IDS.includes(mainCategory)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }
    if (typeof monthlyLimit !== "number" || monthlyLimit <= 0) {
      return NextResponse.json({ error: "Monthly limit must be a positive number." }, { status: 400 });
    }

    await upsertBudget(user.id, mainCategory, monthlyLimit);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
