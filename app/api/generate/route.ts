import { run } from "@/lib/pipeline";
import { saveJob } from "@/lib/jobs";

export const maxDuration = 300;

const MAX_BYTES = 15 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const form = await req.formData();
  const image = form.get("image");
  if (!image || typeof image === "string") return Response.json({ error: "Upload an image." }, { status: 400 });
  if (!TYPES.includes(image.type)) return Response.json({ error: "Use a PNG, JPG, WebP or GIF image." }, { status: 415 });
  if (image.size > MAX_BYTES) return Response.json({ error: "Image is over 15 MB." }, { status: 413 });

  const text = (k: string) => String(form.get(k) ?? "").trim().slice(0, 2000);
  const color = text("color");
  try {
    const result = await run({
      image: Buffer.from(await image.arrayBuffer()),
      mime: image.type,
      description: text("description"),
      name: text("name") || undefined,
      color: /^#[0-9a-f]{6}$/i.test(color) ? color : undefined,
    });
    const id = await saveJob(result.files);
    return Response.json({
      id,
      spec: result.spec,
      mode: result.mode,
      notes: result.notes,
      previews: result.previews,
      files: Object.entries(result.files).map(([name, b]) => ({ name, bytes: b.length })),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Generation failed." }, { status: 500 });
  }
}
