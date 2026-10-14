import sharp from "sharp";
import type { Vectorized } from "@/lib/vector/vectorize";
import { svgDoc, type Layer } from "./svg";

// 8 x 10 in at 300 DPI
export const PRINT = { width: 2400, height: 3000, density: 300 };

/** Rasterise the vector flat at print size, transparent background, 300 DPI metadata. */
async function canvasFor(v: Vectorized, layers: Layer[]) {
  const scale = Math.min((PRINT.width * 0.94) / v.width, (PRINT.height * 0.94) / v.height);
  const w = Math.round(v.width * scale);
  const h = Math.round(v.height * scale);
  const flat = await sharp(Buffer.from(svgDoc(v, layers)), { density: 72 * scale })
    .resize(w, h)
    .png()
    .toBuffer();
  const canvas = sharp({
    create: { width: PRINT.width, height: PRINT.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: flat, gravity: "centre" }]);
  return canvas;
}

export async function rasterLayer(v: Vectorized, layers: Layer[]) {
  return (await canvasFor(v, layers)).withMetadata({ density: PRINT.density }).png().toBuffer();
}

export async function rasterRaw(v: Vectorized, layers: Layer[]) {
  return (await canvasFor(v, layers)).raw().toBuffer();
}
