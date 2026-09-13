"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ForgotPasswordForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Something went wrong.");

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-orbs bg-radial-glow px-6">
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
          {t("auth.forgot.title")}
        </h1>
        <p className="mt-1 text-center text-sm text-muted">
          {t("auth.forgot.subtitle")}
        </p>

        {sent ? (
          <p className="mt-8 rounded-xl border border-accent/30 bg-accent/10 px-3 py-3 text-center text-sm text-accent">
            {t("auth.forgot.success")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <label className="text-xs text-muted">
              {t("auth.email")}
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                placeholder="you@example.com"
              />
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
              {submitting ? t("auth.forgot.loading") : t("auth.forgot.cta")}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/login" className="font-medium text-accent hover:underline">
            {t("auth.forgot.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
