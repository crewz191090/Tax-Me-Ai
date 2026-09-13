"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import type { SyncFailure } from "@/lib/offlineQueue";

export default function SyncStatusBanner({
  pendingCount,
  syncing,
  syncErrors,
  onSyncNow,
  onDiscardFailed,
}: {
  pendingCount: number;
  syncing: boolean;
  syncErrors: SyncFailure[];
  onSyncNow: () => void;
  onDiscardFailed: () => void;
}) {
  const { t } = useLanguage();
  const online = useOnlineStatus();

  if (online && pendingCount === 0 && syncErrors.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-amber-300">
          {!online && (
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-medium">
              📴 {t("dashboard.offline")}
            </span>
          )}
          {pendingCount > 0 && (
            <span>
              {pendingCount} {t("dashboard.pendingSync")}
            </span>
          )}
        </div>
        {pendingCount > 0 && online && (
          <button
            onClick={onSyncNow}
            disabled={syncing}
            className="btn-pill btn-pill-sm border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
          >
            {syncing ? t("dashboard.syncing") : t("dashboard.syncNow")}
          </button>
        )}
      </div>

      {syncErrors.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg bg-red-500/10 p-3">
          <p className="text-xs text-red-300">{t("dashboard.syncFailedNotice")}</p>
          <ul className="flex flex-col gap-1 text-xs text-red-300/90">
            {syncErrors.map((f) => (
              <li key={f.localId}>
                <span className="font-medium">{f.merchant || "—"}</span>: {f.message}
              </li>
            ))}
          </ul>
          <button
            onClick={onDiscardFailed}
            className="btn-pill btn-pill-danger btn-pill-sm self-start"
          >
            {t("dashboard.discardFailed")}
          </button>
        </div>
      )}
    </div>
  );
}
