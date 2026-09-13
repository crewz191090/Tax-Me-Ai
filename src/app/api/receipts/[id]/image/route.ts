import { NextRequest, NextResponse } from "next/server";
import { getReceiptImageKey } from "@/lib/db";
import { getReceiptImage } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  const key = await getReceiptImageKey(user.id, id);

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
