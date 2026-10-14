import { writePsd } from "ag-psd";
import type { Vectorized } from "@/lib/vector/vectorize";
import { rasterRaw, PRINT } from "./raster";

/** Layered PSD: Fill (garment colour) and Outline (seams + stitching) on transparent layers. */
export async function psdDoc(v: Vectorized) {
  const layer = async (name: string, layers: ("fill" | "outline")[]) => {
    const data = await rasterRaw(v, layers);
    return { name, imageData: { width: PRINT.width, height: PRINT.height, data: new Uint8ClampedArray(data) } };
  };
  const [fill, outline, all] = await Promise.all([
    layer("Fill", ["fill"]),
    layer("Outline", ["outline"]),
    rasterRaw(v, ["fill", "outline"]),
  ]);
  const psd = writePsd(
    {
      width: PRINT.width,
      height: PRINT.height,
      imageData: { width: PRINT.width, height: PRINT.height, data: new Uint8ClampedArray(all) },
      children: [fill, outline],
    },
    { generateThumbnail: false },
  );
  return Buffer.from(psd);
}
