import { run } from "@/lib/pipeline";
import { createDesign, refundCredit, spendCredit } from "@/lib/designs";
import { aiEnabled } from "@/lib/ai/generate-flat";
import { getViewer } from "@/lib/auth/viewer";

export const maxDuration = 300;

const MAX_BYTES = 15 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "Log in to generate designs." }, { status: 401 });

  const form = await req.formData();
  const image = form.get("image");
  if (!image || typeof image === "string") return Response.json({ error: "Upload an image." }, { status: 400 });
  if (!TYPES.includes(image.type)) return Response.json({ error: "Use a PNG, JPG, WebP or GIF image." }, { status: 415 });
  if (image.size > MAX_BYTES) return Response.json({ error: "Image is over 15 MB." }, { status: 413 });

  const text = (k: string) => String(form.get(k) ?? "").trim().slice(0, 2000);
  const color = text("color");

  // AI designs cost a credit, taken up front so parallel requests cannot overspend.
  const cost = aiEnabled() ? 1 : 0;
  if (cost && !(await spendCredit(viewer.id))) {
    return Response.json({ error: "You are out of credits. Upgrade your plan to keep designing." }, { status: 402 });
  }
  try {
    const result = await run({
      image: Buffer.from(await image.arrayBuffer()),
      mime: image.type,
      description: text("description"),
      name: text("name") || undefined,
      color: /^#[0-9a-f]{6}$/i.test(color) ? color : undefined,
    });
    return Response.json({ id: await createDesign(viewer.id, result, cost) });
  } catch (e) {
    console.error(e);
    if (cost) await refundCredit(viewer.id);
    return Response.json({ error: e instanceof Error ? e.message : "Generation failed." }, { status: 500 });
  }
}
