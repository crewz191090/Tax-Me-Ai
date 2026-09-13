# Tax Me AI

Malaysian receipt & tax tracker. Snap or upload a receipt, AI extracts the
merchant/amount/date/category, and simplified LHDN-style deductibility rules
are applied automatically.

**Live:** https://tax-me-ai.pelaporan-manpower-fms.workers.dev

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
- `src/lib/` — D1, R2, Gemini, and deductibility-rule helpers

## Disclaimer

Tax Me AI is an independent tool, not affiliated with or endorsed by
LHDN / IRBM. Deductibility results are AI-generated estimates — always
verify with a qualified tax agent before filing.
