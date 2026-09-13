# Tax Me AI

Malaysian personal expense tracker with built-in tax relief tracking. Snap
or upload a receipt and AI does two things at once: files it under a general
expense category (Housing, Food, Transport, Health, ...) for everyday
budgeting, and — separately — flags it against LHDN's official individual
tax relief categories (YA2025) if it qualifies, tracking how much of each
relief's annual cap you've used. Bilingual (EN/BM). Requires an account
(email/password, with forgot-password) so each user's receipts are private.

**Live:** https://tax-me-ai.pelaporan-manpower-fms.workers.dev

- General expense categories: [`src/lib/expenseCategories.ts`](src/lib/expenseCategories.ts)
  — 15 main categories, ~130 subcategories.
- LHDN tax relief categories, caps, and descriptions:
  [`src/lib/reliefCategories.ts`](src/lib/reliefCategories.ts), sourced from
  LHDN's "Pelepasan Cukai Individu Pemastautin" YA2025 brochure.

These are simplified summaries for personal planning only — always verify
with LHDN or a licensed tax agent before filing.

## Stack

- **Next.js 16** (App Router) + Tailwind CSS
- **Google Gemini** (`gemini-3.6-flash`) for receipt vision extraction — free tier
- **Cloudflare Workers** for hosting, via [OpenNext](https://opennext.js.org/cloudflare)
- **Cloudflare D1** — receipt records (SQLite-compatible)
- **Cloudflare R2** — receipt image storage

## Local development

```bash
npm install
cp .env.local.example .env.local   # add your GEMINI_API_KEY
npm run dev
```

Get a free Gemini key at https://aistudio.google.com/apikey.

Local D1 and R2 are emulated automatically by `next dev` via the OpenNext
Cloudflare dev integration — no extra setup needed for `npm run dev`.

For `.dev.vars` (used by `wrangler dev` / `npm run preview`), copy the same
key:

```bash
echo "GEMINI_API_KEY=your_key_here" > .dev.vars
```

## Database schema

`schema.sql` is the canonical shape for a **fresh** database:

```bash
npm run db:migrate:local    # local D1
npm run db:migrate:remote   # production D1
```

For an **existing** database with real data, don't re-run `schema.sql` —
apply the numbered file(s) in `migrations/` instead, in order:

```bash
npx wrangler d1 execute tax-me-ai-db --remote --file=./migrations/002_expense_tracker_fields.sql
```

## Deploy

```bash
npm run deploy
```

This builds the Next.js app with OpenNext and deploys the Worker, with
bindings to the `tax-me-ai-db` D1 database and `tax-me-ai-receipts` R2
bucket (configured in `wrangler.jsonc`).

Set the production secret once:

```bash
npx wrangler secret put GEMINI_API_KEY
```

## Project structure

- `src/app/page.tsx` — marketing landing page
- `src/app/dashboard/page.tsx` — receipt upload + management UI
- `src/app/api/scan` — Gemini vision extraction endpoint
- `src/app/api/receipts` — D1-backed CRUD for receipts
- `src/app/api/receipts/[id]/image` — serves receipt images from R2
- `src/lib/expenseCategories.ts` — general expense category/subcategory taxonomy
- `src/lib/reliefCategories.ts` — the LHDN relief categories and caps
- `src/lib/reliefCalc.ts` — category breakdowns, spending trends, relief summary math
- `src/lib/auth/` — password hashing, sessions, users, password reset
- `src/lib/i18n/` — EN/BM language context and dictionary
- `src/lib/` — D1, R2, and Gemini helpers

## Disclaimer

Tax Me AI is an independent tool, not affiliated with or endorsed by
LHDN / IRBM. Relief category matches are AI-generated estimates — always
verify with a qualified tax agent before filing.
