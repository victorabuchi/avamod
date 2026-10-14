# Avamod

Upload a garment photo (for example a hoodie saved from a retail site) and get a vector technical flat and tech pack in every common design format.

## Pipeline

1. **Analyze** (Claude vision): garment type, colour, fabric, construction, trims, points of measure.
2. **Redraw** (Gemini image model): clean front and back flat sketch on white, from the photo plus your notes.
3. **Vectorize** (potrace): silhouette fill layer and outline/stitching layer as real vector paths.
4. **Export**: SVG, 300 DPI transparent PNG, PDF, AI (PDF-compatible), EPS, layered PSD, and a tech pack PDF (flats, colour, points of measure, construction, trims), plus a zip of everything.

Without API keys it still runs: the uploaded image is traced directly (front only, generic measurements). That works well on images that are already flats.

## Run

Needs Node 22+ and Postgres 16.

```
createdb avamod
cp .env.example .env.local   # DATABASE_URL, SESSION_SECRET (32+ chars), optional API keys
npm install
npm run migrate
npm run dev
```

Keys: `ANTHROPIC_API_KEY` (analysis), `GEMINI_API_KEY` (flat generation; model via `GEMINI_IMAGE_MODEL`).

## Stack

- Next.js (App Router), CSS modules, Figtree. Design language follows Pursecast and ChronKeep: compact, hairline borders, cobalt accent, dark mode.
- Postgres via `pg`, plain SQL migrations in `migrations/` (`npm run migrate`).
- Email and password accounts: scrypt hashing, signed httpOnly session cookie, login throttling.
- Credits: AI designs cost 1 credit (3 free on signup), recorded in `credit_ledger`. Tracing an existing flat without AI keys is free.
- Design files live in `.data/designs/` behind `lib/storage.ts`; swap for S3/R2 before running multiple servers.

## Notes

- `.ai` is a PDF-compatible file, which Illustrator opens natively.
- Measurements are estimates from an image; verify against a physical sample.
- PNG/PSD canvas is 2400 x 3000 px (8 x 10 in at 300 DPI).
