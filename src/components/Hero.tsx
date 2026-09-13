import LiveStats from "./LiveStats";
import ReceiptStack from "./ReceiptStack";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-radial-glow">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:grid-cols-2 md:items-center md:pt-24">
        <div>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Receipt intelligence for Malaysia
          </span>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Every receipt.
            <br />
            <span className="text-gradient">Ready for tax.</span>
          </h1>

          <p className="mt-5 max-w-md text-lg text-muted">
            Snap a photo or upload your receipts and let AI turn them into
            clean, organised records — sorted, categorised, and ready to
            export whenever you need them.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="/dashboard"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-strong"
            >
              Start free
            </a>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 text-sm font-medium text-foreground/90 hover:text-foreground"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border">
                ▶
              </span>
              See how it scans
            </a>
          </div>

          <p className="mt-4 text-xs text-muted">
            100% free &nbsp;·&nbsp; Unlimited scans &nbsp;·&nbsp; No credit
            card &nbsp;·&nbsp; No sign-up required
          </p>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["RH", "SA", "ES", "LT"].map((initials) => (
                <span
                  key={initials}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-surface-2 text-[10px] font-semibold text-muted"
                >
                  {initials}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted">
              Malaysian sole traders, Sdn Bhds
              <br className="hidden sm:block" /> and the accountants who file
              for them
            </p>
          </div>
        </div>

        <div className="relative flex flex-col items-center gap-6 md:items-end">
          <div className="w-full max-w-sm">
            <LiveStats />
          </div>
          <div className="flex w-full justify-center md:justify-end">
            <ReceiptStack />
          </div>
        </div>
      </div>

      <div className="border-y border-border bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5 text-sm text-muted">
          <span className="font-medium text-foreground/80">
            One scan. Clean data.
          </span>
          <span>Export to AutoCount, SQL Account, Million, Bukku, Xero and Excel</span>
          <span>Private by design</span>
        </div>
      </div>
    </section>
  );
}
