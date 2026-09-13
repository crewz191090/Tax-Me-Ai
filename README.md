# Tax Me AI

Malaysian personal tax relief tracker. Snap or upload a receipt, AI matches
it to one of LHDN's official individual tax relief categories (YA2025), and
tracks how much of each category's annual cap you've used. Bilingual (EN/BM).

**Live:** https://tax-me-ai.pelaporan-manpower-fms.workers.dev

Relief categories, caps, and descriptions live in
[`src/lib/reliefCategories.ts`](src/lib/reliefCategories.ts), sourced from
LHDN's "Pelepasan Cukai Individu Pemastautin" YA2025 brochure. This is a
simplified summary for personal planning only — always verify with LHDN or
a licensed tax agent before filing.

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

Applied via `schema.sql`. To (re)apply:

```bash
npm run db:migrate:local    # local D1
npm run db:migrate:remote   # production D1
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
- `src/lib/reliefCategories.ts` — the 16 LHDN relief categories and caps
- `src/lib/reliefCalc.ts` — per-category, per-year relief summary math
- `src/lib/i18n/` — EN/BM language context and dictionary
- `src/lib/` — D1, R2, and Gemini helpers

## Disclaimer

Tax Me AI is an independent tool, not affiliated with or endorsed by
LHDN / IRBM. Relief category matches are AI-generated estimates — always
verify with a qualified tax agent before filing.
