"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { RELIEF_CATEGORIES } from "@/lib/reliefCategories";

export default function ReliefOverview() {
  const { lang, t } = useLanguage();
  const categories = RELIEF_CATEGORIES.filter((c) => c.cap > 0);
  const currentYear = new Date().getFullYear();

  return (
    <section id="relief" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          {t("relief.eyebrow")}
        </p>
        <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          {t("relief.title").replace("{year}", String(currentYear))}
        </h2>
        <p className="mt-4 max-w-2xl text-muted">{t("relief.subtitle")}</p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="glow-border rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">
                  {lang === "bm" ? category.nameBm : category.nameEn}
                </h3>
                <span className="font-mono-tight whitespace-nowrap rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                  RM {category.cap.toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {lang === "bm" ? category.descriptionBm : category.descriptionEn}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-2xl text-xs text-muted">{t("relief.disclaimer")}</p>
      </div>
    </section>
  );
}
