# Flatsmith

Upload a garment photo (for example a hoodie saved from a retail site) and get a vector technical flat and tech pack in every common design format.

## Pipeline

1. **Analyze** (Claude vision): garment type, colour, fabric, construction, trims, points of measure.
2. **Redraw** (Gemini image model): clean front and back flat sketch on white, from the photo plus your notes.
3. **Vectorize** (potrace): silhouette fill layer and outline/stitching layer as real vector paths.
4. **Export**: SVG, 300 DPI transparent PNG, PDF, AI (PDF-compatible), EPS, layered PSD, and a tech pack PDF (flats, colour, points of measure, construction, trims), plus a zip of everything.

Without API keys it still runs: the uploaded image is traced directly (front only, generic measurements). That works well on images that are already flats.

## Run

```
cp .env.example .env.local   # add keys
npm install
npm run dev
```

Keys: `ANTHROPIC_API_KEY` (analysis), `GEMINI_API_KEY` (flat generation; model via `GEMINI_IMAGE_MODEL`).

Job output is written to `.data/jobs/` (gitignored).

## Notes

- `.ai` is a PDF-compatible file, which Illustrator opens natively.
- Measurements are estimates from an image; verify against a physical sample.
- PNG/PSD canvas is 2400 x 3000 px (8 x 10 in at 300 DPI).
