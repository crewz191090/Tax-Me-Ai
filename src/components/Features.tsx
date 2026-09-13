const FEATURES = [
  {
    title: "Tax rules built in",
    description:
      "Deductibility logic covers 50% meals, motor vehicle apportionment, and capital allowances.",
  },
  {
    title: "Bulk scan",
    description:
      "Upload dozens of receipts at once. Process your whole shoebox in minutes.",
  },
  {
    title: "Accountant-ready PDF",
    description:
      "Export a clean audit report and share a read-only link directly with your accountant.",
  },
  {
    title: "Collection link",
    description:
      "Send staff or clients one link by WhatsApp or email. They upload receipts with no account needed.",
  },
  {
    title: "Private & encrypted",
    description: "Encrypted at rest. Your data belongs to you, and only you.",
  },
  {
    title: "Smart e-invoice detection",
    description:
      "Auto-detects e-invoices from your suppliers and badges them as validated, no manual tagging.",
  },
];

export default function Features() {
  return (
    <section id="features" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          Features
        </p>
        <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          Everything your accountant wishes you had.
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/40"
            >
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
