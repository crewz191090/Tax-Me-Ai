const INCLUDED = [
  "Unlimited receipt scans",
  "AI extraction — merchant, amount, date, category",
  "Automatic deductibility rules",
  "CSV export for your accountant",
  "Private, on-device storage",
];

export default function FreeForever() {
  return (
    <section id="pricing" className="border-b border-border py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          Pricing
        </p>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          100% free. No catch.
        </h2>
        <p className="mt-4 text-muted">
          Tax Me AI is free for everyone — no scan limits, no credit card,
          no hidden tiers.
        </p>

        <div className="mt-10 grid gap-3 rounded-2xl border border-border bg-surface p-6 text-left sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 text-accent">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <a
          href="/dashboard"
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-strong"
        >
          Start scanning free
        </a>
      </div>
    </section>
  );
}
