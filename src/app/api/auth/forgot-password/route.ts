import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/auth/users";
import { createPasswordResetToken } from "@/lib/auth/passwordReset";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email/resend";
import { checkRateLimit, getClientIp } from "@/lib/auth/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = (body.email ?? "").trim();

    const ip = getClientIp(req);
    const allowed = await checkRateLimit({
      key: `forgot-password:${ip}:${email.toLowerCase()}`,
      limit: 5,
      windowSeconds: 60 * 60,
    });

    // Always respond the same way whether or not the account exists (or
    // the request was rate-limited), so this endpoint can't be used to
    // enumerate registered emails.
    const genericResponse = NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });

    if (!allowed || !email) return genericResponse;

    const user = await findUserByEmail(email);
    if (!user) return genericResponse;

    const token = await createPasswordResetToken(user.id);
    // Prefer an explicitly configured app URL over the request's own origin
    // (derived from the Host header), which a client can spoof unless the
    // edge strictly validates it — an attacker-controlled origin here would
    // let them harvest reset tokens sent to real users.
    const origin = process.env.APP_URL || req.nextUrl.origin;
    const resetUrl = `${origin}/reset-password?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Tax Me AI password",
        html: passwordResetEmailHtml(resetUrl),
      });
    } catch (emailErr) {
      // Don't leak email-sending failures to the client — log and still
      // return the generic response so we don't reveal account existence.
      console.error("Failed to send password reset email:", emailErr);
    }

    return genericResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
