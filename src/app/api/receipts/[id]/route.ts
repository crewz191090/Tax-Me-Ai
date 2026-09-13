import { NextRequest, NextResponse } from "next/server";
import { deleteReceiptById, updateReceiptFields } from "@/lib/db";
import { RELIEF_CATEGORY_IDS } from "@/lib/reliefCategories";
import {
  ALL_SUBCATEGORY_IDS,
  mainCategoryForSubcategory,
  type TransactionType,
} from "@/lib/expenseCategories";
import { deleteReceiptImage } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth/session";
import type { Receipt } from "@/lib/types";

export const runtime = "nodejs";

const TRANSACTION_TYPES: TransactionType[] = ["expense", "income", "transfer"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await req.json()) as {
      merchant?: string;
      date?: string;
      amount?: number;
      subcategory?: string;
      reliefCategory?: string | null;
      type?: string;
      paymentMethod?: string | null;
      accountName?: string | null;
      tags?: string | null;
      isRecurring?: boolean;
      location?: string | null;
      notes?: string;
    };

    const updates: Partial<
      Pick<
        Receipt,
        | "merchant"
        | "date"
        | "amount"
        | "mainCategory"
        | "subcategory"
        | "reliefCategory"
        | "type"
        | "paymentMethod"
        | "accountName"
        | "tags"
        | "isRecurring"
        | "location"
        | "notes"
      >
    > = {};
    if (typeof body.merchant === "string") updates.merchant = body.merchant;
    if (typeof body.date === "string") updates.date = body.date;
    if (typeof body.amount === "number") updates.amount = body.amount;
    if (typeof body.subcategory === "string" && ALL_SUBCATEGORY_IDS.includes(body.subcategory)) {
      updates.subcategory = body.subcategory;
      updates.mainCategory = mainCategoryForSubcategory(body.subcategory);
    }
    if (body.reliefCategory === null) {
      updates.reliefCategory = null;
    } else if (typeof body.reliefCategory === "string" && RELIEF_CATEGORY_IDS.includes(body.reliefCategory)) {
      updates.reliefCategory = body.reliefCategory;
    }
    if (typeof body.type === "string" && TRANSACTION_TYPES.includes(body.type as TransactionType)) {
      updates.type = body.type as TransactionType;
    }
    if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod;
    if (body.accountName !== undefined) updates.accountName = body.accountName;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (typeof body.isRecurring === "boolean") updates.isRecurring = body.isRecurring;
    if (body.location !== undefined) updates.location = body.location;
    if (typeof body.notes === "string") updates.notes = body.notes;

    await updateReceiptFields(user.id, id, updates);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const imageKey = await deleteReceiptById(user.id, id);
    if (imageKey) {
      await deleteReceiptImage(imageKey);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
