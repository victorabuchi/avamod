import { randomUUID } from "crypto";
import sharp from "sharp";
import { many, one } from "@/lib/db";
import { vectorize } from "@/lib/vector/vectorize";
import { pathBBox, type BBox } from "@/lib/vector/geometry";
import { putFiles } from "@/lib/storage";
import { defaultMeasurements, type GarmentSpec } from "@/lib/spec";

export type View = { width: number; height: number; fillD: string; outlineD: string; bbox: BBox };
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
  return { width: v.width, height: v.height, fillD: v.fillD, outlineD: v.outlineD, bbox: pathBBox(v.fillD) };
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
