import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { generateSpendingInsight } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      periodLabel?: string;
      totalSpent?: number;
      totalIncome?: number;
      breakdown?: { name: string; amount: number }[];
      lang?: "en" | "bm";
    };

    const insight = await generateSpendingInsight({
      periodLabel: body.periodLabel ?? "this period",
      totalSpent: body.totalSpent ?? 0,
      totalIncome: body.totalIncome ?? 0,
      breakdown: body.breakdown ?? [],
      lang: body.lang === "bm" ? "bm" : "en",
    });

    return NextResponse.json({ insight });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
