"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

export default function SyncStatusBanner({
  pendingCount,
  syncing,
  onSyncNow,
}: {
  pendingCount: number;
  syncing: boolean;
  onSyncNow: () => void;
}) {
  const { t } = useLanguage();
  const online = useOnlineStatus();

  if (online && pendingCount === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-amber-300">
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
  );
}
