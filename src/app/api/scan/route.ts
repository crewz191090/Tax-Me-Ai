import { NextRequest, NextResponse } from "next/server";
import { extractReceiptFromImage as extractWithDeepSeek } from "@/lib/deepseek";
import { extractReceiptFromImage as extractWithGemini } from "@/lib/gemini";
import { getSessionUser } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/auth/rateLimit";
import type { ExtractedReceipt } from "@/lib/types";

function isUnrelatedImageError(err: unknown): boolean {
  return err instanceof Error && (err as Error & { code?: string }).code === "UNRELATED_IMAGE";
}

/**
 * Three-tier OCR fallback: DeepSeek first (primary, paid, no quota worries),
 * then Gemini (backup provider if DeepSeek's API has an outage or errors),
 * then — if both AI providers fail — the caller (UploadReceipt.tsx) falls
 * back to fully local, in-browser Tesseract OCR. An "unrelated image"
 * verdict is a genuine rejection, not a provider failure, so it's never
 * retried against the next tier — that would just waste a call.
 */
async function extractReceiptWithFallback(params: {
  base64Data: string;
  mimeType: string;
}): Promise<ExtractedReceipt> {
  try {
    return await extractWithDeepSeek(params);
  } catch (deepseekErr) {
    if (isUnrelatedImageError(deepseekErr)) throw deepseekErr;
    console.error("DeepSeek scan failed, falling back to Gemini:", deepseekErr);

    try {
      return await extractWithGemini(params);
    } catch (geminiErr) {
      if (isUnrelatedImageError(geminiErr)) throw geminiErr;
      console.error("Gemini scan also failed, falling back to local OCR:", geminiErr);
      throw geminiErr;
    }
  }
}

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const allowed = await checkRateLimit({
    key: `scan:${user.id}:${getClientIp(req)}`,
    limit: 60,
    windowSeconds: 60 * 60,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many scan requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max 10MB." },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a JPG, PNG, or WEBP image." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const extracted = await extractReceiptWithFallback({
      base64Data,
      mimeType: file.type,
    });

    return NextResponse.json({ extracted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const code = err instanceof Error ? (err as Error & { code?: string }).code : undefined;

    if (code === "UNRELATED_IMAGE") {
      return NextResponse.json({ error: message, unrelated: true }, { status: 422 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
