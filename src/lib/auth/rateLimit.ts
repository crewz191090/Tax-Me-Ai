import { getCfEnv } from "@/lib/cloudflare";

/**
 * Fixed-window request counter backed by D1. Not perfectly atomic under
 * concurrent requests, but that only ever lets a handful of extra requests
 * through — fine for an abuse deterrent, not a hard security boundary.
 */
export async function checkRateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<boolean> {
  const env = await getCfEnv();
  const now = Date.now();
  const windowMs = params.windowSeconds * 1000;

  const row = await env.DB.prepare(
    "SELECT count, window_start FROM rate_limits WHERE key = ?"
  )
    .bind(params.key)
    .first<{ count: number; window_start: number }>();

  if (!row || now - row.window_start > windowMs) {
    await env.DB.prepare(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start`
    )
      .bind(params.key, now)
      .run();
    return true;
  }

  if (row.count >= params.limit) {
    return false;
  }

  await env.DB.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?")
    .bind(params.key)
    .run();
  return true;
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
