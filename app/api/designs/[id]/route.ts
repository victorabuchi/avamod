import { getViewer } from "@/lib/auth/viewer";
import { updateDesign } from "@/lib/designs";
import type { Params } from "@/lib/render";

export const maxDuration = 120;

export async function PUT(req: Request, ctx: RouteContext<"/api/designs/[id]">) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "Log in first." }, { status: 401 });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { name?: string; summary?: string; params?: Params } | null;
  if (!body?.params) return Response.json({ error: "Missing params." }, { status: 400 });
  try {
    await updateDesign(viewer.id, id, { name: body.name, summary: body.summary, params: body.params });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Could not save." }, { status: 500 });
  }
}
