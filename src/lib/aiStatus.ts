import { MODEL as DEEPSEEK_MODEL } from "./deepseek";
import { MODEL as GEMINI_MODEL } from "./gemini";

export interface AiStatus {
  /** True when at least one provider can serve a scan — the scan route falls back between them. */
  online: boolean;
  deepseek: boolean;
  gemini: boolean;
}

const CACHE_TTL_MS = 60_000;
const PROBE_TIMEOUT_MS = 5_000;

let cached: { status: AiStatus; at: number } | null = null;

// Both probes hit free metadata endpoints (model lookup), never a generation
// call, so checking status costs no tokens. They also confirm the exact model
// the scanner uses still exists — a renamed/retired model is a common way for
// scanning to start failing while the API key itself stays valid.
async function deepseekReachable(): Promise<boolean> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return false;
  const res = await fetch("https://api.deepseek.com/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  });
  if (!res.ok) return false;
  const body = (await res.json()) as { data?: { id: string }[] };
  return Boolean(body.data?.some((m) => m.id === DEEPSEEK_MODEL));
}

async function geminiReachable(): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return false;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`,
    { headers: { "x-goog-api-key": apiKey }, signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) }
  );
  return res.ok;
}

async function settle(probe: () => Promise<boolean>): Promise<boolean> {
  try {
    return await probe();
  } catch {
    return false;
  }
}

export async function getAiStatus(): Promise<AiStatus> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.status;

  const [deepseek, gemini] = await Promise.all([
    settle(deepseekReachable),
    settle(geminiReachable),
  ]);
  const status: AiStatus = { online: deepseek || gemini, deepseek, gemini };
  cached = { status, at: Date.now() };
  return status;
}
