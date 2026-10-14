import { getViewer, isUnlimited } from "@/lib/auth/viewer";
import { pool } from "@/lib/db";
import { removeDesign } from "@/lib/storage";

async function admin() {
  const v = await getViewer();
  return v && isUnlimited(v) ? v : null;
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/templates/[id]">) {
  if (!(await admin())) return Response.json({ error: "Admins only." }, { status: 403 });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { active?: boolean };
  await pool.query("update templates set active = $2 where id = $1", [id, !!body.active]);
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/templates/[id]">) {
  if (!(await admin())) return Response.json({ error: "Admins only." }, { status: 403 });
  const { id } = await ctx.params;
  const r = await pool.query("delete from templates where id = $1", [id]);
  if (r.rowCount) await removeDesign(id);
  return Response.json({ ok: true });
}
