import { NextRequest, NextResponse } from "next/server";
import { consumePasswordResetToken } from "@/lib/auth/passwordReset";
import { hashPassword } from "@/lib/auth/password";
import { updateUserPassword } from "@/lib/auth/users";
import { deleteAllSessionsForUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { token?: string; password?: string };
    const token = body.token ?? "";
    const password = body.password ?? "";

    if (!token) {
      return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const userId = await consumePasswordResetToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    await updateUserPassword(userId, passwordHash);
    await deleteAllSessionsForUser(userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
