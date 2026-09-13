"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";

export default function FreeForever() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const items = [
    t("free.item1"),
    t("free.item2"),
    t("free.item3"),
    t("free.item4"),
    t("free.item5"),
  ];

  return (
    <section id="pricing" className="border-b border-border py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          {t("free.eyebrow")}
        </p>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("free.title")}
        </h2>
        <p className="mt-4 text-muted">{t("free.subtitle")}</p>

        <div className="glow-border mt-10 grid gap-3 rounded-2xl border border-border bg-surface p-6 text-left sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 text-accent">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <a
          href={user ? "/dashboard" : "/register"}
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-strong"
        >
          {t("free.cta")}
        </a>
      </div>
    </section>
  );
}
