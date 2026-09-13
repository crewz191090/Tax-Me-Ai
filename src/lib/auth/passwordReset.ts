import { getCfEnv } from "@/lib/cloudflare";

const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 hour

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const env = await getCfEnv();
  const token = newToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_DURATION_MS).toISOString();

  await env.DB.prepare(
    "INSERT INTO password_resets (token, user_id, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)"
  )
    .bind(token, userId, expiresAt, new Date().toISOString())
    .run();

  return token;
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const env = await getCfEnv();
  const row = await env.DB.prepare(
    "SELECT user_id, expires_at, used FROM password_resets WHERE token = ?"
  )
    .bind(token)
    .first<{ user_id: string; expires_at: string; used: number }>();

  if (!row || row.used) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  await env.DB.prepare("UPDATE password_resets SET used = 1 WHERE token = ?")
    .bind(token)
    .run();

  return row.user_id;
}
