const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to .env.local — get a free key at https://resend.com/signup"
    );
  }

  const from = process.env.EMAIL_FROM || "Tax Me AI <onboarding@resend.dev>";

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to send email (${res.status}): ${body}`);
  }
}

export function passwordResetEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #05070a;">Reset your Tax Me AI password</h2>
      <p style="color: #333; line-height: 1.6;">
        We received a request to reset your password. Click the button below to
        choose a new one. This link expires in 1 hour.
      </p>
      <p style="margin: 32px 0;">
        <a href="${resetUrl}"
           style="background: #22d3ee; color: #05070a; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600; display: inline-block;">
          Reset password
        </a>
      </p>
      <p style="color: #777; font-size: 13px; line-height: 1.6;">
        If you didn't request this, you can safely ignore this email — your
        password will not be changed.
      </p>
    </div>
  `;
}
