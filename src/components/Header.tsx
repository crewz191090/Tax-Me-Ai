"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const { user, loading, logout } = useAuth();

  return (
    <header className="glass sticky top-0 z-50 border-b border-border/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Tax Me AI"
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg object-contain"
          />
          <span className="text-base font-semibold tracking-tight">
            Tax Me AI
          </span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {!loading && user && (
            <Link href="/dashboard" className="btn-pill btn-pill-outline btn-pill-sm">
              {t("nav.dashboard")}
            </Link>
          )}

          <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1 text-xs">
            {(["en", "bm"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setLang(option)}
                className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
                  lang === option
                    ? "bg-surface-2 text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {!loading && user ? (
            <>
              <span className="hidden max-w-[140px] truncate text-xs text-muted md:inline">
                {user.email}
              </span>
              <button onClick={logout} className="btn-pill btn-pill-outline btn-pill-sm">
                {t("nav.logout")}
              </button>
            </>
          ) : (
            !loading && (
              <>
                <Link href="/login" className="btn-pill btn-pill-ghost btn-pill-sm">
                  {t("nav.login")}
                </Link>
                <Link href="/register" className="btn-pill btn-pill-primary btn-pill-sm">
                  {t("nav.getStarted")}
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}
