import { NextRequest, NextResponse } from "next/server";
import { insertReceipt, listReceipts, newReceiptId } from "@/lib/db";
import { uploadReceiptImage } from "@/lib/storage";
import { RELIEF_CATEGORY_IDS } from "@/lib/reliefCategories";
import type { Receipt } from "@/lib/types";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function GET() {
  try {
    const receipts = await listReceipts();
    return NextResponse.json({ receipts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const merchant = String(formData.get("merchant") ?? "").trim();
    const date = String(formData.get("date") ?? "");
    const amount = parseFloat(String(formData.get("amount") ?? "0"));
    const rawCategory = String(formData.get("category") ?? "not_deductible");
    const category = RELIEF_CATEGORY_IDS.includes(rawCategory)
      ? rawCategory
      : "not_deductible";
    const isEInvoice = String(formData.get("isEInvoice") ?? "false") === "true";
    const file = formData.get("file");

    if (!merchant || !date || Number.isNaN(amount)) {
      return NextResponse.json(
        { error: "Missing required fields: merchant, date, amount." },
        { status: 400 }
      );
    }

    const id = newReceiptId();
    let imageKey: string | null = null;

    if (file instanceof File) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: "File too large. Max 10MB." },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Unsupported file type." },
          { status: 400 }
        );
      }

      const ext = file.type.split("/")[1] ?? "jpg";
      imageKey = `receipts/${id}.${ext}`;
      const buffer = await file.arrayBuffer();
      await uploadReceiptImage({
        key: imageKey,
        data: buffer,
        contentType: file.type,
      });
    }

    const receipt: Receipt = {
      id,
      merchant,
      date,
      amount,
      category,
      imageKey,
      isEInvoice,
      createdAt: new Date().toISOString(),
    };

    await insertReceipt(receipt);

    return NextResponse.json({ receipt }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
