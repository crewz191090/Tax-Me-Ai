import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createIncomeEntry, listIncomeEntries } from "@/lib/incomeDb";
import { INCOME_TYPE_IDS } from "@/lib/incomeTypes";

export const runtime = "nodejs";

function parseYearMonth(req: NextRequest): { year?: number; month?: number } {
  const url = new URL(req.url);
  const yearParam = url.searchParams.get("year");
  const monthParam = url.searchParams.get("month");
  return {
    year: yearParam ? Number(yearParam) : undefined,
    month: monthParam ? Number(monthParam) : undefined,
  };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // year/month are both optional here: omitting month lists a whole year,
  // and omitting both lists every entry the user has ever recorded — the
  // dashboard uses that to keep the monthly tracker and any multi-month
  // view (e.g. yearly cash flow) in sync with the same data.
  const { year, month } = parseYearMonth(req);

  try {
    const entries = await listIncomeEntries(user.id, year, month);
    return NextResponse.json({ entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
      label?: string | null;
    };
    const year = body.year ?? 0;
    const month = body.month ?? 0;
    const amount = body.amount ?? 0;
    const incomeType = body.incomeType ?? "";
    const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : null;

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid year/month." }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Income amount must be a positive number." }, { status: 400 });
    }
    if (!INCOME_TYPE_IDS.includes(incomeType)) {
      return NextResponse.json({ error: "Invalid income type." }, { status: 400 });
    }

    const id = await createIncomeEntry(user.id, year, month, amount, incomeType, label);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
