import { zipSync } from "fflate";
import sharp from "sharp";
import { analyzeGarment } from "@/lib/ai/analyze";
import { generateFlat, type View } from "@/lib/ai/generate-flat";
import { vectorize, type Vectorized } from "@/lib/vector/vectorize";
import { svgDoc } from "@/lib/export/svg";
import { rasterLayer } from "@/lib/export/raster";
import { epsDoc } from "@/lib/export/eps";
import { flatPdf, techPackPdf } from "@/lib/export/pdf";
import { psdDoc } from "@/lib/export/psd";
import type { GarmentSpec } from "@/lib/spec";

export type Result = {
  spec: GarmentSpec;
  mode: "ai" | "trace";
  notes: string[];
  files: Record<string, Buffer>;
  previews: { front: string; back?: string };
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "style";

export async function run(input: { image: Buffer; mime: string; description: string; name?: string; color?: string }): Promise<Result> {
  const notes: string[] = [];
  const normalized = await sharp(input.image).rotate().png().toBuffer();
  const spec = await analyzeGarment(input.image, input.mime, input.description, input);
  if (!process.env.ANTHROPIC_API_KEY) notes.push("ANTHROPIC_API_KEY not set: using generic measurements and a basic spec.");

  const flats: Partial<Record<View, Vectorized>> = {};
  let mode: Result["mode"] = "trace";
  for (const view of ["front", "back"] as View[]) {
    const gen = await generateFlat(input.image, input.mime, input.description, view);
    if (gen) mode = "ai";
    if (!gen && view === "back") {
      notes.push("GEMINI_API_KEY not set: traced the uploaded image directly (front only).");
      break;
    }
    flats[view] = await vectorize(gen ?? normalized, input.color ?? (gen ? spec.primaryColor : undefined));
  }
  const front = flats.front!;
  spec.primaryColor ||= front.fillColor;

  const base = slug(spec.name);
  const files: Record<string, Buffer> = {};
  for (const [view, v] of Object.entries(flats) as [View, Vectorized][]) {
    const n = `${base}-${view}`;
    files[`${n}.svg`] = Buffer.from(svgDoc(v, ["fill", "outline"], n));
    files[`${n}-300dpi.png`] = await rasterLayer(v, ["fill", "outline"]);
    files[`${n}.eps`] = Buffer.from(epsDoc(v, n));
    files[`${n}.pdf`] = await flatPdf(v, n);
    files[`${n}.ai`] = files[`${n}.pdf`]; // Illustrator opens PDF-compatible .ai
    files[`${n}-layers.psd`] = await psdDoc(v);
  }
  files[`${base}-techpack.pdf`] = await techPackPdf(spec, { front, back: flats.back });
  files[`${base}-spec.json`] = Buffer.from(JSON.stringify(spec, null, 2));
  files[`${base}-all.zip`] = Buffer.from(
    zipSync(Object.fromEntries(Object.entries(files).map(([k, b]) => [k, new Uint8Array(b)]))),
  );

  return {
    spec,
    mode,
    notes,
    files,
    previews: { front: svgDoc(front), back: flats.back && svgDoc(flats.back) },
  };
}
