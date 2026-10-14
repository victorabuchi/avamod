import { createFromPhoto, createFromRedraw, refundCredit, spendCredit } from "@/lib/designs";
import { aiEnabled } from "@/lib/ai/generate-flat";
import { getViewer } from "@/lib/auth/viewer";

export const maxDuration = 300;

const MAX_BYTES = 15 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "Log in to create designs." }, { status: 401 });

  const form = await req.formData();
  const image = form.get("image");
  if (!image || typeof image === "string") return Response.json({ error: "Upload an image." }, { status: 400 });
  const mime = TYPES.find((t) => t === image.type);
  if (!mime) return Response.json({ error: "Use a PNG, JPG, WebP or GIF image." }, { status: 415 });
  if (image.size > MAX_BYTES) return Response.json({ error: "Image is over 15 MB." }, { status: 413 });
  const text = (k: string) => String(form.get(k) ?? "").trim().slice(0, 2000);

  // Two ways to make a design: "template" (match one of the owner's templates) or "redraw" (AI redraws the photo).
  const mode = text("mode") === "redraw" ? "redraw" : "template";
  // A new design costs a credit, taken up front so parallel requests cannot overspend. Edits are free.
  // Redraw costs a credit only when the paid image model is on; otherwise it just traces the upload.
  const cost = mode === "template" || aiEnabled() ? 1 : 0;
  if (cost && !(await spendCredit(viewer.id))) {
    return Response.json({ error: "You are out of credits. Upgrade your plan to keep designing." }, { status: 402 });
  }
  try {
    const base = { image: Buffer.from(await image.arrayBuffer()), mime, description: text("description"), name: text("name") || undefined };
    const color = text("color");
    const id =
      mode === "redraw"
        ? await createFromRedraw(viewer.id, { ...base, color: /^#[0-9a-f]{6}$/i.test(color) ? color : undefined })
        : await createFromPhoto(viewer.id, { ...base, templateId: text("templateId") || undefined });
    return Response.json({ id });
  } catch (e) {
    console.error(e);
    if (cost) await refundCredit(viewer.id);
    return Response.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });
  }
}
