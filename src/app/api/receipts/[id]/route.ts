import { NextRequest, NextResponse } from "next/server";
import { deleteReceiptById, updateReceiptFields } from "@/lib/db";
import { RELIEF_CATEGORY_IDS } from "@/lib/reliefCategories";
import { deleteReceiptImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      merchant?: string;
      date?: string;
      amount?: number;
      category?: string;
      notes?: string;
    };

    const updates: Record<string, string | number> = {};
    if (typeof body.merchant === "string") updates.merchant = body.merchant;
    if (typeof body.date === "string") updates.date = body.date;
    if (typeof body.amount === "number") updates.amount = body.amount;
    if (typeof body.category === "string" && RELIEF_CATEGORY_IDS.includes(body.category)) {
      updates.category = body.category;
    }
    if (typeof body.notes === "string") updates.notes = body.notes;

    await updateReceiptFields(id, updates);

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
  try {
    const { id } = await params;
    const imageKey = await deleteReceiptById(id);
    if (imageKey) {
      await deleteReceiptImage(imageKey);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
