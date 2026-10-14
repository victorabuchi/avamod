import { getViewer } from "@/lib/auth/viewer";
import { getTemplate } from "@/lib/templates";
import { svgDoc } from "@/lib/export/svg";

// Thumbnail of a template's front flat in neutral grey.
export async function GET(_req: Request, ctx: RouteContext<"/api/templates/[id]">) {
  if (!(await getViewer())) return new Response("Unauthorized", { status: 401 });
  const t = await getTemplate((await ctx.params).id);
  if (!t) return new Response("Not found", { status: 404 });
  const v = t.views.front;
  const svg = svgDoc({ width: v.width, height: v.height, fillD: v.fillD, outlineD: v.outlineD, shadeD: v.shadeD, fillColor: "#c8c8c8", shadeColor: "#7a7a7a" }, ["fill", "outline"]);
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=300", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } });
}
