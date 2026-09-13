"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function CtaSection() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-border bg-radial-glow py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("cta.title")}
        </h2>
        <p className="mt-4 text-muted">{t("cta.subtitle")}</p>

        <a
          href="/dashboard"
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-strong"
        >
          {t("cta.button")}
        </a>

        <p className="mt-4 text-xs text-muted">{t("cta.note")}</p>
      </div>
    </section>
  );
}
