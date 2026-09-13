const STEPS = [
  {
    number: "01",
    title: "Snap or upload",
    description:
      "Take a photo, upload an image or PDF, or drop in an e-invoice XML. Any format works.",
  },
  {
    number: "02",
    title: "AI reads everything",
    description:
      "Merchant, amount, date and category are extracted automatically. Zero typing.",
  },
  {
    number: "03",
    title: "Tax rules applied",
    description:
      "Deductibility is calculated automatically — 50% meals, motor vehicle apportionment, capital allowances, all handled.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          How it works
        </p>
        <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          Three steps. Thirty seconds.
        </h2>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <span className="text-sm font-mono text-accent">
                {step.number}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-surface-2 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-muted">TOTAL</div>
              <div className="text-2xl font-bold">RM 24.50</div>
            </div>
            <div className="flex gap-6 text-xs text-muted">
              <span>Merchant</span>
              <span>Amount</span>
              <span>Date</span>
              <span>Category</span>
            </div>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
              100% Fully claimable
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
