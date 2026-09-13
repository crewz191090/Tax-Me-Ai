"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import GlassSegmentedControl from "./GlassSegmentedControl";

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const { user, loading, logout } = useAuth();

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-6">
      <div className="glass-nav mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-3xl px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Tax Me AI"
            width={44}
            height={44}
            className="h-11 w-11 rounded-lg object-contain"
          />
          <span className="text-2xl font-bold tracking-tight">
            Tax Me AI
          </span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {!loading && user && (
            <Link href="/dashboard" className="glass-pill-btn">
              {t("nav.dashboard")}
            </Link>
          )}

          <GlassSegmentedControl
            value={lang}
            onChange={setLang}
            options={[
              { value: "en", label: "EN" },
              { value: "bm", label: "BM" },
            ]}
          />

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
