import { randomUUID } from "crypto";
import { many, one, pool } from "@/lib/db";
import { putFiles, removeDesign } from "@/lib/storage";
import type { Result } from "@/lib/pipeline";
import type { GarmentSpec } from "@/lib/spec";

export type Design = {
  id: string;
  name: string;
  garment_type: string;
  summary: string;
  color: string;
  mode: "ai" | "trace";
  notes: string[];
  spec: GarmentSpec;
  files: { name: string; bytes: number }[];
  created_at: Date;
};

const COLS = "id, name, garment_type, summary, color, mode, notes, spec, files, created_at";

export async function createDesign(userId: string, r: Result, cost: number) {
  const id = randomUUID();
  await putFiles(id, r.files);
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into designs (id, user_id, name, garment_type, summary, color, mode, notes, spec, files)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, userId, r.spec.name, r.spec.garmentType, r.spec.summary, r.spec.primaryColor, r.mode, JSON.stringify(r.notes), JSON.stringify(r.spec),
        JSON.stringify(Object.entries(r.files).map(([name, b]) => ({ name, bytes: b.length })))],
    );
    if (cost) await client.query("update credit_ledger set design_id = $1 where id = (select max(id) from credit_ledger where user_id = $2 and reason = 'design' and design_id is null)", [id, userId]);
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    await removeDesign(id);
    throw e;
  } finally {
    client.release();
  }
  return id;
}

export const listDesigns = (userId: string, limit = 50) =>
  many<Design>(`select ${COLS} from designs where user_id = $1 order by created_at desc limit $2`, [userId, limit]);

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

/** Atomically spend one credit. Returns false when the balance is empty. */
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
