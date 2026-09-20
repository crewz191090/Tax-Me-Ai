import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { createUser, findUserByEmail } from "@/lib/auth/users";
import { checkRateLimit, getClientIp } from "@/lib/auth/rateLimit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const allowed = await checkRateLimit({
      key: `register:${ip}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { email?: string; password?: string };
    const email = (body.email ?? "").trim();
    const password = body.password ?? "";

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);

    // Always respond the same way whether or not the email is already
    // registered, so this endpoint can't be used to enumerate accounts —
    // same status, same body shape, regardless of which branch runs below.
    // A genuinely new signup gets a session cookie and is logged in; a
    // repeat signup for an existing email quietly does nothing (no new
    // account, no cookie), and the dashboard's own auth guard will bounce
    // that request back to /login since no session was created.
    const genericResponse = NextResponse.json({ ok: true }, { status: 201 });

    if (existing) {
      return genericResponse;
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash);
    const token = await createSession(user.id);

    genericResponse.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return genericResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
