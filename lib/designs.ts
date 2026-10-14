import { randomUUID } from "crypto";
import sharp from "sharp";
import { many, one, pool } from "@/lib/db";
import { getFile, putFiles, removeDesign, replaceFiles } from "@/lib/storage";
import { analyzePhoto } from "@/lib/photo";
import { matchTemplate } from "@/lib/ai/match";
import { getTemplate, listTemplates, type Template } from "@/lib/templates";
import { printMeta, renderDesign } from "@/lib/render";
import { FIT_MAX, FIT_MIN, mapY, measurementsFor, type Params } from "@/lib/flat";
import { run as runRedraw } from "@/lib/pipeline";
import type { GarmentSpec } from "@/lib/spec";

export type Design = {
  id: string;
  template_id: string | null;
  name: string;
  garment_type: string;
  summary: string;
  color: string;
  mode: "ai" | "trace" | "template";
  notes: string[];
  spec: GarmentSpec;
  params: Params;
  version: number;
  files: { name: string; bytes: number }[];
  created_at: Date;
  updated_at: Date;
};

const COLS = "id, template_id, name, garment_type, summary, color, mode, notes, spec, params, version, files, created_at, updated_at";

/** Files that belong to the design but are not exports. */
export const REFERENCE = "reference.jpg";
export const PRINT = "print.png";
const INTERNAL = [REFERENCE, PRINT];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function cleanParams(p: Params, aspectFallback = 0.3): Params {
  return {
    color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "#c8c8c8",
    fit: { w: clamp(Number(p.fit?.w) || 1, FIT_MIN, FIT_MAX), l: clamp(Number(p.fit?.l) || 1, FIT_MIN, FIT_MAX) },
    print: p.print && {
      enabled: !!p.print.enabled,
      cx: clamp(Number(p.print.cx) || 0.5, 0, 1),
      cy: clamp(Number(p.print.cy) || 0.4, 0, 1),
      w: clamp(Number(p.print.w) || 0.2, 0.03, 0.8),
      aspect: Number(p.print.aspect) > 0 ? Number(p.print.aspect) : aspectFallback,
    },
    overrides: Object.fromEntries(
      Object.entries(p.overrides ?? {}).filter(([k, v]) => k.length <= 4 && Number.isFinite(Number(v)) && Number(v) > 0).map(([k, v]) => [k, Number(v)]),
    ),
  };
}

function specFor(t: Template, p: Params, o: { name: string; summary: string; fabric?: string; construction?: string[]; trims?: string[] }): GarmentSpec {
  return {
    name: o.name,
    garmentType: t.garment_type,
    summary: o.summary,
    primaryColor: p.color,
    fabric: o.fabric || t.fabric || "To be confirmed",
    construction: o.construction?.length ? o.construction : t.construction,
    trims: o.trims?.length ? o.trims : t.trims,
    measurements: measurementsFor(t.measurements, p),
  };
}

const list = (files: Record<string, Buffer>) => Object.entries(files).map(([name, b]) => ({ name, bytes: b.length }));

/** Photo in, design out: analyse, match a template, adapt it, render every export. */
export async function createFromPhoto(
  userId: string,
  input: { image: Buffer; mime: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; description: string; name?: string; templateId?: string },
) {
  const templates = await listTemplates();
  if (!templates.length) throw new Error("No templates are available yet. Ask the owner to add some.");

  const [photo, match] = await Promise.all([
    analyzePhoto(input.image),
    matchTemplate(input.image, input.mime, input.description, templates, input.templateId),
  ]);
  const t = match.template;
  const front = t.views.front;

  // Start from the template's proportions, nudged toward the photo's.
  const tAspect = front.bbox.w / front.bbox.h;
  const params: Params = {
    color: photo.color,
    fit: { w: clamp(photo.aspect / tAspect, 0.9, 1.15), l: 1 },
    overrides: {},
  };
  let printPng: Buffer | undefined;
  if (photo.print) {
    printPng = photo.print.png;
    const { aspect } = await printMeta(printPng);
    const r = photo.print.rel;
    params.print = {
      enabled: true,
      cx: (front.bbox.x + (r.x + r.w / 2) * front.bbox.w) / front.width,
      cy: (front.bbox.y + mapY(r.y + r.h / 2, photo.shoulder, front.shoulder) * front.bbox.h) / front.height,
      w: (r.w * front.bbox.w) / front.width,
      aspect,
    };
  }
  const clean = cleanParams(params);
  const name = input.name || match.name || t.name;
  const spec = specFor(t, clean, { name, summary: match.summary || input.description || t.description, ...match });

  const id = randomUUID();
  const files = await renderDesign(t, spec, clean, printPng);
  const extra: Record<string, Buffer> = { [REFERENCE]: await sharp(input.image, { limitInputPixels: false }).rotate().resize(1400, 1400, { fit: "inside" }).jpeg({ quality: 82 }).toBuffer() };
  if (printPng) extra[PRINT] = printPng;
  await putFiles(id, { ...files, ...extra });
  const notes: string[] = [];
  if (match.how === "keywords") notes.push(`Template chosen from your description (${t.name}). Switch it if it is not the right cut.`);
  try {
    await pool.query(
      `insert into designs (id, user_id, template_id, name, garment_type, summary, color, mode, notes, spec, params, files)
       values ($1,$2,$3,$4,$5,$6,$7,'template',$8,$9,$10,$11)`,
      [id, userId, t.id, name, t.garment_type, spec.summary, clean.color, JSON.stringify(notes), JSON.stringify(spec), JSON.stringify(clean), JSON.stringify(list({ ...files, ...extra }))],
    );
  } catch (e) {
    await removeDesign(id);
    throw e;
  }
  return id;
}

/**
 * Mode 1, "Redraw": the AI redraws the photo as a fresh flat (needs GEMINI_API_KEY and ANTHROPIC_API_KEY;
 * without them the uploaded image is traced directly). No template is involved.
 */
export async function createFromRedraw(
  userId: string,
  input: { image: Buffer; mime: string; description: string; name?: string; color?: string },
) {
  const r = await runRedraw(input);
  const id = randomUUID();
  await putFiles(id, r.files);
  try {
    await pool.query(
      `insert into designs (id, user_id, template_id, name, garment_type, summary, color, mode, notes, spec, params, files)
       values ($1,$2,null,$3,$4,$5,$6,$7,$8,$9,'{}',$10)`,
      [id, userId, r.spec.name, r.spec.garmentType, r.spec.summary, r.spec.primaryColor, r.mode, JSON.stringify(r.notes), JSON.stringify(r.spec), JSON.stringify(list(r.files))],
    );
  } catch (e) {
    await removeDesign(id);
    throw e;
  }
  return id;
}

/** Re-render a design after the user edited it. */
export async function updateDesign(userId: string, id: string, edit: { name?: string; summary?: string; params: Params }) {
  const d = await getDesign(userId, id);
  if (!d?.template_id) throw new Error("Design not found");
  const t = await getTemplate(d.template_id);
  if (!t) throw new Error("The template for this design was removed");
  const params = cleanParams(edit.params, d.params.print?.aspect);
  const name = (edit.name ?? d.name).trim().slice(0, 80) || d.name;
  const spec = specFor(t, params, { name, summary: edit.summary ?? d.summary, fabric: d.spec.fabric, construction: d.spec.construction, trims: d.spec.trims });
  const printPng = (await getFile(id, PRINT)) ?? undefined;
  const files = await renderDesign(t, spec, params, printPng);
  await replaceFiles(id, files, INTERNAL);
  const all = [...list(files), ...d.files.filter((f) => INTERNAL.includes(f.name))];
  await pool.query(
    `update designs set name=$3, summary=$4, color=$5, spec=$6, params=$7, files=$8, version=version+1, updated_at=now()
     where user_id=$1 and id=$2`,
    [userId, id, name, spec.summary, params.color, JSON.stringify(spec), JSON.stringify(params), JSON.stringify(all)],
  );
}

export const listDesigns = (userId: string, limit = 50) =>
  many<Design>(`select ${COLS} from designs where user_id = $1 order by updated_at desc limit $2`, [userId, limit]);

export const getDesign = (userId: string, id: string) =>
  /^[0-9a-f-]{36}$/.test(id) ? one<Design>(`select ${COLS} from designs where user_id = $1 and id = $2`, [userId, id]) : Promise.resolve(null);

export async function deleteDesign(userId: string, id: string) {
  const r = await pool.query("delete from designs where user_id = $1 and id = $2", [userId, id]);
  if (r.rowCount) await removeDesign(id);
}

export const designStats = (userId: string) =>
  one<{ designs: string; files: string }>(
    "select count(*)::text as designs, coalesce(sum(jsonb_array_length(files)),0)::text as files from designs where user_id = $1",
    [userId],
  );

/** Atomically spend one credit. Admins are unlimited. Returns false when the balance is empty. */
export async function spendCredit(userId: string): Promise<boolean> {
  const plan = await one<{ plan: string }>("select plan from users where id = $1", [userId]);
  if (plan?.plan === "admin") return true;
  const client = await pool.connect();
  try {
    await client.query("begin");
    const r = await client.query("update users set credits = credits - 1 where id = $1 and credits > 0", [userId]);
    if (!r.rowCount) {
      await client.query("rollback");
      return false;
    }
    await client.query("insert into credit_ledger (user_id, delta, reason) values ($1, -1, 'design')", [userId]);
    await client.query("commit");
    return true;
  } finally {
    client.release();
  }
}

export async function refundCredit(userId: string) {
  const plan = await one<{ plan: string }>("select plan from users where id = $1", [userId]);
  if (plan?.plan === "admin") return;
  await pool.query("update users set credits = credits + 1 where id = $1", [userId]);
  await pool.query("insert into credit_ledger (user_id, delta, reason) values ($1, 1, 'refund')", [userId]);
}
