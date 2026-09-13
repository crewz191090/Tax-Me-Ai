"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import ReceiptStack from "./ReceiptStack";

export default function Hero() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <section id="top" className="relative overflow-hidden bg-radial-glow">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:grid-cols-2 md:items-center md:pt-24">
        <div>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono-tight text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {t("hero.badge")}
          </span>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            {t("hero.title1")}
            <br />
            <span className="text-gradient">{t("hero.title2")}</span>
          </h1>

          <p className="mt-5 max-w-md text-lg text-muted">{t("hero.subtitle")}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={user ? "/dashboard" : "/register"}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-strong"
            >
              {t("hero.cta")}
            </a>
          </div>

          <p className="mt-4 text-xs text-muted">{t("hero.note")}</p>

          <p className="mt-8 text-xs text-muted">{t("hero.trustedBy")}</p>
        </div>

        <div className="relative flex flex-col items-center gap-6 md:items-end">
          <div className="flex w-full justify-center md:justify-end">
            <ReceiptStack />
          </div>
        </div>
      </div>

      <div className="border-y border-border bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5 text-sm text-muted">
          <span className="font-medium text-foreground/80">{t("hero.strip")}</span>
        </div>
      </div>
    </section>
  );
}
