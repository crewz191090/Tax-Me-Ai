"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  const links = [
    { label: t("nav.dashboard"), href: "/dashboard" },
    { label: t("relief.eyebrow"), href: "/#relief" },
    { label: t("privacy.eyebrow"), href: "/#security" },
  ];

  return (
    <footer className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Tax Me AI"
                width={28}
                height={28}
                className="h-7 w-7 rounded-lg object-contain"
              />
              <span className="text-base font-semibold">Tax Me AI</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("footer.product")}
            </h4>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-foreground">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted">
          <p>{t("footer.disclaimer")}</p>
          <p className="mt-2">© 2026 Tax Me AI. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
