import { NextRequest, NextResponse } from "next/server";
import { getReceiptImageKey } from "@/lib/db";
import { getReceiptImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const key = await getReceiptImageKey(id);

  if (!key) {
    return NextResponse.json({ error: "No image for this receipt." }, { status: 404 });
  }

  const image = await getReceiptImage(key);
  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  return new NextResponse(image.body, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
