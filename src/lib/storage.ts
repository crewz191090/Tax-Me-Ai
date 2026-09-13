import { getCfEnv } from "./cloudflare";

export async function uploadReceiptImage(params: {
  key: string;
  data: ArrayBuffer;
  contentType: string;
}): Promise<void> {
  const env = await getCfEnv();
  await env.RECEIPTS_BUCKET.put(params.key, params.data, {
    httpMetadata: { contentType: params.contentType },
  });
}

export async function getReceiptImage(
  key: string
): Promise<{ body: ReadableStream; contentType: string } | null> {
  const env = await getCfEnv();
  const object = await env.RECEIPTS_BUCKET.get(key);
  if (!object) return null;

  return {
    body: object.body,
    contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
  };
}

export async function deleteReceiptImage(key: string): Promise<void> {
  const env = await getCfEnv();
  await env.RECEIPTS_BUCKET.delete(key);
}
