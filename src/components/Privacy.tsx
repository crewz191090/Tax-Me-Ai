const POINTS = [
  {
    title: "No ad trackers",
    description:
      "Zero ad-tracking scripts on this site. Your tax data is never used for advertising.",
  },
  {
    title: "Never trains AI",
    description:
      "Your receipts are never used to train public AI models. Analysis happens, then is discarded.",
  },
  {
    title: "Encrypted at rest",
    description: "All data is stored encrypted, in line with PDPA 2010.",
  },
  {
    title: "7-year retention",
    description:
      "LHDN requires 7-year records under ITA 1967 s.82. Kept automatically while your account is active.",
  },
  {
    title: "Export anytime",
    description:
      "Download your data or delete your account whenever you like. No lock-in.",
  },
  {
    title: "Not affiliated with LHDN",
    description:
      "Tax Me AI is an independent app, not affiliated with or endorsed by LHDN / IRBM. Always file on mytax.hasil.gov.my.",
  },
];

export default function Privacy() {
  return (
    <section id="security" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          Privacy &amp; trust
        </p>
        <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          Your receipts are yours. Full stop.
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POINTS.map((point) => (
            <div key={point.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
