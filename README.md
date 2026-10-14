# Avamod

Upload a garment photo (for example a hoodie saved from a retail site) and get a vector technical flat and tech pack in every common design format.

## How it works

The owner keeps a library of finished flats and tech packs (**Templates**, admin only). A designer uploads a photo of a garment and Avamod:

1. **Analyses the photo**: finds the garment, reads the true fabric colour, and cuts out any chest graphic with transparency.
2. **Matches a template**: Claude picks the closest template and reads fabric, construction and trims off the photo (needs `ANTHROPIC_API_KEY`). Without a key it matches on your description or the template you choose.
3. **Adapts the template**: fabric colour, width and length, and the graphic placed by aligning shoulder lines.
4. **Renders every export**: SVG, 300 DPI transparent PNG, PDF, AI, EPS, layered PSD, tech pack PDF, and a zip.
5. **Editor**: review next to the photo, change colour, fit, graphic position and measurements, save to rebuild all files (versioned).

Because every design starts from a clean template, vectors are always production-quality; no image generation is involved, so a design costs almost nothing to produce.

## Run

Needs Node 22+ and Postgres 16.

```
createdb avamod
cp .env.example .env.local   # DATABASE_URL, SESSION_SECRET (32+ chars), optional API keys
npm install
npm run migrate
npm run dev
```

Optional key: `ANTHROPIC_API_KEY` for automatic template matching and fabric/construction notes (`MATCH_MODEL` to change the model).

Create an admin: `EMAIL=you@x.com NAME=You PASSWORD=... PLAN=admin npx tsx scripts/create-user.mts`. Add templates on the Templates page. For local development only, `scripts/seed-templates.mts` loads flats from a folder (check their licence before using them for customers).

## Stack

- Next.js (App Router), CSS modules, Figtree. Design language follows Pursecast and ChronKeep: compact, hairline borders, cobalt accent, dark mode.
- Postgres via `pg`, plain SQL migrations in `migrations/` (`npm run migrate`).
- Email and password accounts: scrypt hashing, signed httpOnly session cookie, login throttling.
- Credits: a new design costs 1 credit (3 free on signup), recorded in `credit_ledger`; editing is free; admins are unlimited.
- Design files live in `.data/designs/` behind `lib/storage.ts`; swap for S3/R2 before running multiple servers.

## Notes

- `.ai` is a PDF-compatible file, which Illustrator opens natively.
- Measurements are estimates from an image; verify against a physical sample.
- PNG/PSD canvas is 2400 x 3000 px (8 x 10 in at 300 DPI).
