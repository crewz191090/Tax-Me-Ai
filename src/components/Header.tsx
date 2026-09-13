"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [{ label: t("nav.dashboard"), href: "/dashboard" }];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 rounded-full border border-border bg-surface p-1 text-xs sm:flex">
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

          <a
            href="/dashboard"
            className="hidden rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-strong sm:inline-block"
          >
            {t("nav.getStarted")}
          </a>

          <button
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg border border-border p-2 text-muted md:hidden"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border bg-background px-6 py-4 text-sm text-muted md:hidden">
          <div className="mb-2 flex items-center gap-1 rounded-full border border-border bg-surface p-1 text-xs w-fit">
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
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-2 transition-colors hover:bg-surface hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="mt-2 rounded-full bg-accent px-4 py-2 text-center font-semibold text-black"
          >
            {t("nav.getStarted")}
          </a>
        </nav>
      )}
    </header>
  );
}
