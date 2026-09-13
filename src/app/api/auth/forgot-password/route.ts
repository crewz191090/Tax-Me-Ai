import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/auth/users";
import { createPasswordResetToken } from "@/lib/auth/passwordReset";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = (body.email ?? "").trim();

    // Always respond the same way whether or not the account exists,
    // so this endpoint can't be used to enumerate registered emails.
    const genericResponse = NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });

    if (!email) return genericResponse;

    const user = await findUserByEmail(email);
    if (!user) return genericResponse;

    const token = await createPasswordResetToken(user.id);
    const resetUrl = `${req.nextUrl.origin}/reset-password?token=${token}`;

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
