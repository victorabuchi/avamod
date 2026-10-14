import { randomUUID } from "crypto";
import sharp from "sharp";
import { many, one } from "@/lib/db";
import { vectorize } from "@/lib/vector/vectorize";
import { pathBBox, type BBox } from "@/lib/vector/geometry";
import { putFiles } from "@/lib/storage";
import { defaultMeasurements, type GarmentSpec } from "@/lib/spec";
import { shoulderFraction } from "@/lib/flat";

export type View = { width: number; height: number; fillD: string; outlineD: string; shadeD?: string; bbox: BBox; /** Shoulder line as a fraction of the garment height. */ shoulder: number };
export type Template = {
  id: string;
  name: string;
  garment_type: string;
  description: string;
  views: { front: View; back?: View };
  measurements: GarmentSpec["measurements"];
  construction: string[];
  trims: string[];
  fabric: string;
  files: { name: string; bytes: number }[];
  active: boolean;
  created_at: Date;
};

const COLS = "id, name, garment_type, description, views, measurements, construction, trims, fabric, files, active, created_at";

async function toView(input: Buffer): Promise<View> {
  // Big print-resolution flats exceed sharp's default pixel limit.
  const png = await sharp(input, { limitInputPixels: false }).resize(2400, 2400, { fit: "inside" }).png().toBuffer();
  const v = await vectorize(png);
  const bbox = pathBBox(v.fillD);
  // Row widths of the silhouette, to find the shoulder line.
  const H = 300;
  const mask = await sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${v.width}" height="${v.height}"><path d="${v.fillD}" fill="#000" fill-rule="evenodd"/></svg>`),
  )
    .resize({ height: Math.round((H * v.height) / bbox.h) })
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: mw, height: mh } = mask.info;
  const top = Math.floor((bbox.y / v.height) * mh), bottom = Math.ceil(((bbox.y + bbox.h) / v.height) * mh);
  const rows: number[] = [];
  for (let y = top; y < bottom && y < mh; y++) {
    let c = 0;
    for (let x = 0; x < mw; x++) if (mask.data[y * mw + x] > 127) c++;
    rows.push(c);
  }
  return { width: v.width, height: v.height, fillD: v.fillD, outlineD: v.outlineD, shadeD: v.shadeD, bbox, shoulder: shoulderFraction(rows) };
}

export async function ingestTemplate(input: {
  name: string;
  garmentType: string;
  description?: string;
  fabric?: string;
  construction?: string[];
  trims?: string[];
  measurements?: GarmentSpec["measurements"];
  front: Buffer;
  back?: Buffer;
  sourceFiles?: Record<string, Buffer>;
}) {
  const id = randomUUID();
  const front = await toView(input.front);
  const back = input.back ? await toView(input.back) : undefined;
  const files = input.sourceFiles ?? {};
  await putFiles(id, files);
  await one(
    `insert into templates (id, name, garment_type, description, views, measurements, construction, trims, fabric, files)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [id, input.name, input.garmentType, input.description ?? "", JSON.stringify({ front, back }),
      JSON.stringify(input.measurements ?? defaultMeasurements(input.garmentType)),
      JSON.stringify(input.construction ?? []), JSON.stringify(input.trims ?? []), input.fabric ?? "",
      JSON.stringify(Object.entries(files).map(([name, b]) => ({ name, bytes: b.length })))],
  );
  return id;
}

export const listTemplates = (all = false) =>
  many<Template>(`select ${COLS} from templates ${all ? "" : "where active"} order by created_at`);

export const getTemplate = (id: string) =>
  /^[0-9a-f-]{36}$/.test(id) ? one<Template>(`select ${COLS} from templates where id = $1`, [id]) : Promise.resolve(null);
