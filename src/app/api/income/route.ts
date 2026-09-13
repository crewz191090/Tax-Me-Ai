import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { deleteMonthlyIncome, getMonthlyIncome, upsertMonthlyIncome } from "@/lib/incomeDb";
import { INCOME_TYPE_IDS } from "@/lib/incomeTypes";

export const runtime = "nodejs";

function parseYearMonth(req: NextRequest): { year: number; month: number } | null {
  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year"));
  const month = Number(url.searchParams.get("month"));
  if (!year || !month || month < 1 || month > 12) return null;
  return { year, month };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const period = parseYearMonth(req);
  if (!period) {
    return NextResponse.json({ error: "Invalid year/month." }, { status: 400 });
  }

  try {
    const income = await getMonthlyIncome(user.id, period.year, period.month);
    return NextResponse.json({ income });
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
    const body = (await req.json()) as {
      year?: number;
      month?: number;
      amount?: number;
      incomeType?: string;
    };
    const year = body.year ?? 0;
    const month = body.month ?? 0;
    const amount = body.amount ?? 0;
    const incomeType = body.incomeType ?? "";

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid year/month." }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Income amount must be a positive number." }, { status: 400 });
    }
    if (!INCOME_TYPE_IDS.includes(incomeType)) {
      return NextResponse.json({ error: "Invalid income type." }, { status: 400 });
    }

    await upsertMonthlyIncome(user.id, year, month, amount, incomeType);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const period = parseYearMonth(req);
  if (!period) {
    return NextResponse.json({ error: "Invalid year/month." }, { status: 400 });
  }

  try {
    await deleteMonthlyIncome(user.id, period.year, period.month);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
