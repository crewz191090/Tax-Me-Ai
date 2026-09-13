"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import FloatingOrbs from "./FloatingOrbs";

export default function ResetPasswordForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Something went wrong.");

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-radial-glow px-6">
      <FloatingOrbs />
      <div className="glass glow-border w-full max-w-sm rounded-2xl border border-border p-8">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <Image
            src="/logo.png"
            alt="Tax Me AI"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="text-lg font-semibold tracking-tight">Tax Me AI</span>
        </Link>

        <h1 className="text-center text-xl font-semibold tracking-tight">
          {t("auth.reset.title")}
        </h1>
        <p className="mt-1 text-center text-sm text-muted">{t("auth.reset.subtitle")}</p>

        {!token ? (
          <p className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-center text-sm text-red-300">
            {t("auth.reset.missingToken")}
          </p>
        ) : done ? (
          <p className="mt-8 rounded-xl border border-accent/30 bg-accent/10 px-3 py-3 text-center text-sm text-accent">
            {t("auth.reset.success")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <label className="text-xs text-muted">
              {t("auth.reset.newPassword")}
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                placeholder="••••••••"
              />
              <span className="mt-1 block text-[11px] text-muted/70">
                {t("auth.passwordHint")}
              </span>
            </label>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-strong disabled:opacity-60"
            >
              {submitting ? t("auth.reset.loading") : t("auth.reset.cta")}
            </button>
          </form>
        )}

        {(done || !token) && (
          <p className="mt-6 text-center text-xs text-muted">
            <Link href="/login" className="font-medium text-accent hover:underline">
              {t("auth.reset.goToLogin")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
