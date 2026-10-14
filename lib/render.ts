import { zipSync } from "fflate";
import sharp from "sharp";
import type { Template, View } from "@/lib/templates";
import type { GarmentSpec } from "@/lib/spec";
import { FIT_MAX, FIT_MIN, PAD, outlineFor, shadeFor, measurementsFor, type Params } from "@/lib/flat";
import type { Vectorized } from "@/lib/vector/vectorize";
import { scalePath } from "@/lib/vector/geometry";
import { svgDoc } from "@/lib/export/svg";
import { rasterLayer } from "@/lib/export/raster";
import { epsDoc } from "@/lib/export/eps";
import { flatPdf, techPackPdf } from "@/lib/export/pdf";
import { psdDoc } from "@/lib/export/psd";

export { FIT_MAX, FIT_MIN, type Params };

export const measurementsOf = (t: Template, p: Params) => measurementsFor(t.measurements, p);

/** The template view with colour, fit and print applied, as drawable vector paths. */
export function buildFlat(view: View, p: Params, printPng?: Buffer, withPrint = false): Vectorized {
  const padX = view.width * PAD;
  const padY = view.height * PAD;
  const cx = view.bbox.x + view.bbox.w / 2;
  const cy = view.bbox.y + view.bbox.h / 2;
  const flat: Vectorized = {
    width: Math.round(view.width + 2 * padX),
    height: Math.round(view.height + 2 * padY),
    fillD: scalePath(view.fillD, p.fit.w, p.fit.l, cx, cy, padX, padY),
    outlineD: scalePath(view.outlineD, p.fit.w, p.fit.l, cx, cy, padX, padY),
    shadeD: view.shadeD ? scalePath(view.shadeD, p.fit.w, p.fit.l, cx, cy, padX, padY) : undefined,
    fillColor: p.color,
    outlineColor: outlineFor(p.color),
    shadeColor: shadeFor(p.color),
  };
  if (withPrint && p.print?.enabled && printPng) {
    const w = p.print.w * view.width;
    const h = w * p.print.aspect;
    flat.print = { png: printPng, x: padX + p.print.cx * view.width - w / 2, y: padY + p.print.cy * view.height - h / 2, w, h };
  }
  return flat;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "style";

/** Render every export for a design from its template and params. */
export async function renderDesign(t: Template, spec: GarmentSpec, p: Params, printPng?: Buffer) {
  const base = slug(spec.name);
  const files: Record<string, Buffer> = {};
  const flats: { front: Vectorized; back?: Vectorized } = { front: buildFlat(t.views.front, p, printPng, true) };
  if (t.views.back) flats.back = buildFlat(t.views.back, p);

  for (const [view, v] of Object.entries(flats) as ["front" | "back", Vectorized][]) {
    const n = `${base}-${view}`;
    files[`${n}.svg`] = Buffer.from(svgDoc(v, undefined, n));
    files[`${n}-300dpi.png`] = await rasterLayer(v, ["fill", "print", "outline"]);
    files[`${n}.eps`] = Buffer.from(epsDoc(v, n));
    files[`${n}.pdf`] = await flatPdf(v, n);
    files[`${n}.ai`] = files[`${n}.pdf`]; // Illustrator opens PDF-compatible .ai
    files[`${n}-layers.psd`] = await psdDoc(v);
  }
  files[`${base}-techpack.pdf`] = await techPackPdf(spec, flats);
  files[`${base}-spec.json`] = Buffer.from(JSON.stringify({ spec, params: p }, null, 2));
  files[`${base}-all.zip`] = Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([k, b]) => [k, new Uint8Array(b)]))));
  return files;
}

export async function printMeta(png: Buffer) {
  const m = await sharp(png).metadata();
  return { aspect: (m.height ?? 1) / (m.width ?? 1) };
}
