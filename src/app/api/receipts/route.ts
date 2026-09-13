import { NextRequest, NextResponse } from "next/server";
import { insertReceipt, listReceipts, newReceiptId } from "@/lib/db";
import { uploadReceiptImage } from "@/lib/storage";
import { RELIEF_CATEGORY_IDS } from "@/lib/reliefCategories";
import {
  ALL_SUBCATEGORY_IDS,
  mainCategoryForSubcategory,
  type TransactionType,
} from "@/lib/expenseCategories";
import { getSessionUser } from "@/lib/auth/session";
import type { Receipt } from "@/lib/types";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TRANSACTION_TYPES: TransactionType[] = ["expense", "income", "transfer"];

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const receipts = await listReceipts(user.id);
    return NextResponse.json({ receipts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const merchant = String(formData.get("merchant") ?? "").trim();
    const date = String(formData.get("date") ?? "");
    const amount = parseFloat(String(formData.get("amount") ?? "0"));

    const rawSubcategory = String(formData.get("subcategory") ?? "uncategorized");
    const subcategory = ALL_SUBCATEGORY_IDS.includes(rawSubcategory)
      ? rawSubcategory
      : "uncategorized";
    const mainCategory = mainCategoryForSubcategory(subcategory);

    const rawReliefCategory = formData.get("reliefCategory");
    const reliefCategory =
      typeof rawReliefCategory === "string" && RELIEF_CATEGORY_IDS.includes(rawReliefCategory)
        ? rawReliefCategory
        : null;

    const rawType = String(formData.get("type") ?? "expense");
    const type: TransactionType = TRANSACTION_TYPES.includes(rawType as TransactionType)
      ? (rawType as TransactionType)
      : "expense";

    const paymentMethod = formData.get("paymentMethod");
    const accountName = formData.get("accountName");
    const tags = formData.get("tags");
    const location = formData.get("location");
    const isRecurring = String(formData.get("isRecurring") ?? "false") === "true";
    const isEInvoice = String(formData.get("isEInvoice") ?? "false") === "true";
    const notes = formData.get("notes");
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
      imageKey = `receipts/${user.id}/${id}.${ext}`;
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
      mainCategory,
      subcategory,
      reliefCategory,
      type,
      paymentMethod: typeof paymentMethod === "string" ? paymentMethod : null,
      accountName: typeof accountName === "string" ? accountName : null,
      tags: typeof tags === "string" ? tags : null,
      isRecurring,
      location: typeof location === "string" ? location : null,
      notes: typeof notes === "string" ? notes : undefined,
      imageKey,
      isEInvoice,
      createdAt: new Date().toISOString(),
    };

    await insertReceipt(user.id, receipt);

    return NextResponse.json({ receipt }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
