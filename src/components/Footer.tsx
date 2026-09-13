const PRODUCT_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Dashboard", href: "/dashboard" },
];

const COMPANY_LINKS = [
  { label: "Privacy policy", href: "#" },
  { label: "Terms of service", href: "#" },
  { label: "Delete my account", href: "#" },
];

export default function Footer() {
  return (
    <footer className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-black">
                T
              </span>
              <span className="text-base font-semibold">Tax Me AI</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted">
              Scan paper into clean, organised records, ready to review, find
              and export whenever you need them.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Product
            </h4>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-foreground">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Company
            </h4>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-foreground">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Talk to us
            </h4>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
              <li>hello@taxme.ai</li>
              <li>Malaysia</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted">
          <p>
            Tax Me AI is an independent tool and is not affiliated with or
            endorsed by LHDN / IRBM. Tax results are AI-generated estimates —
            verify before filing.
          </p>
          <p className="mt-2">© 2026 Tax Me AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
