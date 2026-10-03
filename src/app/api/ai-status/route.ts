import { NextResponse } from "next/server";
import { getAiStatus } from "@/lib/aiStatus";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const status = await getAiStatus();
  return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
}
