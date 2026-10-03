"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

type AiState = "checking" | "online" | "offline";

const RECHECK_MS = 60_000;

export default function AiStatusBadge() {
  const { t } = useLanguage();
  const deviceOnline = useOnlineStatus();
  const [aiState, setAiState] = useState<AiState>("checking");

  useEffect(() => {
    // No point asking the server when the device itself has no connection.
    if (!deviceOnline) return;

    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/ai-status", { cache: "no-store" });
        const json = (await res.json()) as { online?: boolean };
        if (!cancelled) setAiState(res.ok && json.online ? "online" : "offline");
      } catch {
        // Server unreachable counts as AI unavailable — a scan would fail
        // the same way and drop to local OCR.
        if (!cancelled) setAiState("offline");
      }
    }

    check();
    const timer = setInterval(check, RECHECK_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [deviceOnline]);

  const effective: AiState = deviceOnline ? aiState : "offline";

  if (effective === "checking") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-muted" />
        {t("aiStatus.checking")}
      </div>
    );
  }

  if (effective === "online") {
    return (
      <div className="flex items-center gap-2 text-xs text-accent">
        <span className="h-2 w-2 rounded-full bg-accent" />
        {t("aiStatus.online")}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-300"
    >
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
      <span>{deviceOnline ? t("aiStatus.offline") : t("aiStatus.noInternet")}</span>
    </div>
  );
}
