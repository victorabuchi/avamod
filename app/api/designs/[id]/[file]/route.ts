import { getViewer } from "@/lib/auth/viewer";
import { getDesign } from "@/lib/designs";
import { getFile, MIME } from "@/lib/storage";

export async function GET(req: Request, ctx: RouteContext<"/api/designs/[id]/[file]">) {
  const viewer = await getViewer();
  if (!viewer) return new Response("Unauthorized", { status: 401 });
  const { id, file } = await ctx.params;
  const design = await getDesign(viewer.id, id);
  if (!design || !design.files.some((f) => f.name === file)) return new Response("Not found", { status: 404 });
  const data = await getFile(id, file);
  if (!data) return new Response("Not found", { status: 404 });
  const inline = new URL(req.url).searchParams.has("inline");
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME[file.split(".").pop() ?? ""] ?? "application/octet-stream",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${file}"`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      // SVGs are served inline for previews: forbid scripts.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
    },
  });
}
