"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useLanguage();
  const { refresh } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(json.error || "Something went wrong.");
      }

      await refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-grid bg-radial-glow px-6">
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
          {t(isLogin ? "auth.login.title" : "auth.register.title")}
        </h1>
        <p className="mt-1 text-center text-sm text-muted">
          {t(isLogin ? "auth.login.subtitle" : "auth.register.subtitle")}
        </p>

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

          <label className="text-xs text-muted">
            {t("auth.password")}
            <input
              type="password"
              required
              minLength={isLogin ? undefined : 8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
              placeholder="••••••••"
            />
            {!isLogin && (
              <span className="mt-1 block text-[11px] text-muted/70">
                {t("auth.passwordHint")}
              </span>
            )}
          </label>

          {isLogin && (
            <Link
              href="/forgot-password"
              className="-mt-2 self-end text-xs text-muted hover:text-accent"
            >
              {t("auth.login.forgotLink")}
            </Link>
          )}

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
            {submitting
              ? t(isLogin ? "auth.login.loading" : "auth.register.loading")
              : t(isLogin ? "auth.login.cta" : "auth.register.cta")}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          {t(isLogin ? "auth.login.noAccount" : "auth.register.haveAccount")}{" "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-medium text-accent hover:underline"
          >
            {t(isLogin ? "auth.login.registerLink" : "auth.register.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
