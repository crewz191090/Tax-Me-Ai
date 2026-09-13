"use client";

import { get, set } from "idb-keyval";

const QUEUE_KEY = "tax-me-ai:pending-receipts";

export interface PendingReceipt {
  localId: string;
  merchant: string;
  date: string;
  amount: number;
  subcategory: string;
  reliefCategory: string | null;
  type: string;
  paymentMethod: string;
  accountName: string;
  tags: string;
  isRecurring: boolean;
  location: string;
  isEInvoice: boolean;
  loanTenureMonths: number | null;
  imageDataUrl: string | null;
  imageType: string | null;
  createdAt: string;
}

export async function getPendingReceipts(): Promise<PendingReceipt[]> {
  const queue = await get<PendingReceipt[]>(QUEUE_KEY);
  return queue ?? [];
}

export async function addPendingReceipt(
  receipt: Omit<PendingReceipt, "localId" | "createdAt">
): Promise<PendingReceipt> {
  const queue = await getPendingReceipts();
  const pending: PendingReceipt = {
    ...receipt,
    localId: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await set(QUEUE_KEY, [pending, ...queue]);
  return pending;
}

export async function removePendingReceipt(localId: string): Promise<void> {
  const queue = await getPendingReceipts();
  await set(QUEUE_KEY, queue.filter((r) => r.localId !== localId));
}

export async function clearPendingReceipts(): Promise<void> {
  await set(QUEUE_KEY, []);
}

function dataUrlToFile(dataUrl: string, mimeType: string, filename: string): File {
  const base64 = dataUrl.split(",")[1] ?? dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mimeType });
}

export interface SyncFailure {
  localId: string;
  merchant: string;
  message: string;
}

export async function syncPendingReceipts(): Promise<{
  synced: number;
  failed: number;
  failures: SyncFailure[];
}> {
  const queue = await getPendingReceipts();
  let synced = 0;
  const failures: SyncFailure[] = [];

  for (const item of queue) {
    try {
      const formData = new FormData();
      formData.append("merchant", item.merchant);
      formData.append("date", item.date);
      formData.append("amount", String(item.amount));
      formData.append("subcategory", item.subcategory);
      if (item.reliefCategory) formData.append("reliefCategory", item.reliefCategory);
      formData.append("type", item.type);
      formData.append("isEInvoice", String(item.isEInvoice));
      if (item.paymentMethod) formData.append("paymentMethod", item.paymentMethod);
      if (item.accountName) formData.append("accountName", item.accountName);
      if (item.tags) formData.append("tags", item.tags);
      formData.append("isRecurring", String(item.isRecurring));
      if (item.location) formData.append("location", item.location);
      if (item.loanTenureMonths) formData.append("loanTenureMonths", String(item.loanTenureMonths));
      if (item.imageDataUrl && item.imageType) {
        formData.append("file", dataUrlToFile(item.imageDataUrl, item.imageType, "receipt.jpg"));
      }

      const res = await fetch("/api/receipts", { method: "POST", body: formData });
      if (res.ok) {
        await removePendingReceipt(item.localId);
        synced++;
      } else {
        // The server was reachable and rejected this specific item (bad
        // data, expired session, etc.) — it will keep failing the same way
        // on every retry, so surface it instead of leaving it silently
        // stuck as "waiting to sync" forever.
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        failures.push({
          localId: item.localId,
          merchant: item.merchant,
          message: json.error || `Server rejected this item (${res.status}).`,
        });
      }
    } catch {
      // Network still down (or flaky) — leave it queued and stop trying
      // the rest this round; the next online event will retry everything.
      break;
    }
  }

  return { synced, failed: failures.length, failures };
}
