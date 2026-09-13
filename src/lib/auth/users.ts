import { getCfEnv } from "@/lib/cloudflare";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const env = await getCfEnv();
  const row = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email.toLowerCase().trim())
    .first<UserRow>();
  return row ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const env = await getCfEnv();
  const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first<UserRow>();
  return row ?? null;
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  const env = await getCfEnv();
  await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(passwordHash, userId)
    .run();
}

export async function createUser(email: string, passwordHash: string): Promise<UserRow> {
  const env = await getCfEnv();
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const normalizedEmail = email.toLowerCase().trim();

  await env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)"
  )
    .bind(id, normalizedEmail, passwordHash, createdAt)
    .run();

  return { id, email: normalizedEmail, password_hash: passwordHash, created_at: createdAt };
}
