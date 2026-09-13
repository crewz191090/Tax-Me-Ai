"use client";

import { useState } from "react";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function Header() {
  const [lang, setLang] = useState<"EN" | "BM" | "中文">("EN");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-black">
            T
          </span>
          <span className="text-base font-semibold tracking-tight">
            Tax Me AI
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {NAV_LINKS.map((link) => (
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
            {(["EN", "BM", "中文"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setLang(option)}
                className={`rounded-full px-2.5 py-1 transition-colors ${
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
            Get started free
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
          {NAV_LINKS.map((link) => (
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
            Get started free
          </a>
        </nav>
      )}
    </header>
  );
}
