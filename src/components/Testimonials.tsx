const TESTIMONIALS = [
  {
    quote:
      "As a business owner with a tax background, I find Tax Me AI genuinely useful for tracking expenses. It records and categorises my receipts automatically, saving me real time and effort.",
    name: "Chai Zhen",
    role: "Business Owner · Tax Background",
  },
  {
    quote:
      "The line-item breakdown is clean. As an auditor, structured data like this saves me hours.",
    name: "Syafiq Aiman",
    role: "Auditor · Melaka",
  },
];

export default function Testimonials() {
  return (
    <section className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          What owners say
        </p>
        <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          Built for the shoebox, not the spreadsheet.
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <p className="text-sm leading-relaxed text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
