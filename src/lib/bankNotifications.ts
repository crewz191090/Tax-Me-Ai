import { registerPlugin } from "@capacitor/core";

export interface PendingBankTransaction {
  id: string;
  bank: string;
  amount: number;
  merchant: string;
  /** "out" — money spent/transferred away (an expense). "in" — money received (income). */
  direction: "in" | "out";
  rawText: string;
  postedAt: number;
}

interface BankNotificationCapturePlugin {
  isEnabled(): Promise<{ enabled: boolean }>;
  openSettings(): Promise<void>;
  getPending(): Promise<{ transactions: PendingBankTransaction[] }>;
  clearPending(options: { ids: string[] }): Promise<void>;
  addListener(
    eventName: "transactionDetected",
    listenerFunc: (transaction: PendingBankTransaction) => void
  ): Promise<{ remove: () => void }>;
}

// Native-only plugin (Android) backed by android/app/src/main/java/com/taxmeai/app/
// — there is no corresponding npm package, so it's registered directly by name.
// Calling any method on the web build or before the APK is rebuilt with the
// native plugin simply rejects, which callers should treat the same as
// "not supported here" rather than a real error.
export const BankNotificationCapture = registerPlugin<BankNotificationCapturePlugin>(
  "BankNotificationCapture"
);
