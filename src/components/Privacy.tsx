"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Privacy() {
  const { t } = useLanguage();

  const points = [
    { title: t("privacy.point1.title"), body: t("privacy.point1.body") },
    { title: t("privacy.point2.title"), body: t("privacy.point2.body") },
    { title: t("privacy.point3.title"), body: t("privacy.point3.body") },
    { title: t("privacy.point4.title"), body: t("privacy.point4.body") },
    { title: t("privacy.point5.title"), body: t("privacy.point5.body") },
    { title: t("privacy.point6.title"), body: t("privacy.point6.body") },
  ];

  return (
    <section id="security" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          {t("privacy.eyebrow")}
        </p>
        <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          {t("privacy.title")}
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((point) => (
            <div key={point.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
