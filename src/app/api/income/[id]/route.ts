import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { deleteIncomeEntry, updateIncomeEntry } from "@/lib/incomeDb";
import { INCOME_TYPE_IDS } from "@/lib/incomeTypes";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await req.json()) as {
      amount?: number;
      incomeType?: string;
      label?: string | null;
    };
    const amount = body.amount ?? 0;
    const incomeType = body.incomeType ?? "";
    const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : null;

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Income amount must be a positive number." }, { status: 400 });
    }
    if (!INCOME_TYPE_IDS.includes(incomeType)) {
      return NextResponse.json({ error: "Invalid income type." }, { status: 400 });
    }

    await updateIncomeEntry(user.id, id, amount, incomeType, label);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteIncomeEntry(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
