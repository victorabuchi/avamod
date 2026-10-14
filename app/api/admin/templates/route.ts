import { getViewer, isUnlimited } from "@/lib/auth/viewer";
import { ingestTemplate } from "@/lib/templates";

export const maxDuration = 300;

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer || !isUnlimited(viewer)) return Response.json({ error: "Admins only." }, { status: 403 });

  const form = await req.formData();
  const text = (k: string) => String(form.get(k) ?? "").trim().slice(0, 2000);
  const file = (k: string) => {
    const f = form.get(k);
    return f && typeof f !== "string" && f.size > 0 ? f : null;
  };
  const front = file("front");
  if (!text("name") || !text("garmentType") || !front) return Response.json({ error: "Name, garment type and a front flat are required." }, { status: 400 });
  if (!/^image\/(png|jpeg|webp)$/.test(front.type)) return Response.json({ error: "The front flat must be a PNG, JPG or WebP image." }, { status: 415 });

  const back = file("back");
  const sourceFiles: Record<string, Buffer> = {};
  for (const f of form.getAll("files")) {
    if (typeof f === "string" || f.size === 0) continue;
    sourceFiles[f.name.replace(/[^\w.\- ]+/g, "_")] = Buffer.from(await f.arrayBuffer());
  }
  try {
    const id = await ingestTemplate({
      name: text("name"),
      garmentType: text("garmentType"),
      description: text("description"),
      fabric: text("fabric"),
      front: Buffer.from(await front.arrayBuffer()),
      back: back ? Buffer.from(await back.arrayBuffer()) : undefined,
      sourceFiles,
    });
    return Response.json({ id });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Could not read that image." }, { status: 500 });
  }
}
