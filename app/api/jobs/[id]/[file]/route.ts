import { readJobFile, MIME } from "@/lib/jobs";

export async function GET(_req: Request, ctx: RouteContext<"/api/jobs/[id]/[file]">) {
  const { id, file } = await ctx.params;
  const data = await readJobFile(id, file);
  if (!data) return new Response("Not found", { status: 404 });
  const ext = file.split(".").pop() ?? "";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
