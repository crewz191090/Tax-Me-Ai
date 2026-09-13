export default function CtaSection() {
  return (
    <section className="border-b border-border bg-radial-glow py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Stop guessing. Start claiming.
        </h2>
        <p className="mt-4 text-muted">
          Every receipt you have not scanned is a deduction you cannot claim.
        </p>

        <a
          href="/dashboard"
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-strong"
        >
          Try it free — unlimited scans
        </a>

        <p className="mt-4 text-xs text-muted">
          No credit card &nbsp;·&nbsp; No sign-up &nbsp;·&nbsp; Free forever
        </p>
      </div>
    </section>
  );
}
