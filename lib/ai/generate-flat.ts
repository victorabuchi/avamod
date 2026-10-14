import { GoogleGenAI } from "@google/genai";

/** True when the paid image model is configured; those designs cost a credit. */
export const aiEnabled = () => !!process.env.GEMINI_API_KEY;

export type View = "front" | "back";

const PROMPT = (view: View, description: string) =>
  `Redraw the garment in this reference photo as a professional fashion technical flat sketch, ${view} view.
Strict rules: flat symmetric orthographic drawing, no model, no mannequin, no shadows, no gradients, no wrinkles.
Pure white background. Uniform solid light-grey fill on the garment. Clean black outlines of constant weight.
Show every seam, panel line, pocket, hood, cuff, hem and drawcord as in the reference, with dashed lines for topstitching.
Reproduce the exact proportions and details of the reference garment. Do not add logos or text.
${view === "back" ? "Infer the back from the front: back yoke, back hood panel, no front pocket unless the reference shows a back one." : ""}
Designer's notes: ${description || "none"}`;

/**
 * Returns a PNG/JPEG buffer of the flat sketch, or null when no image model
 * is configured (the caller then traces the uploaded image directly).
 */
export async function generateFlat(
  image: Buffer,
  mime: string,
  description: string,
  view: View,
): Promise<Buffer | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const ai = new GoogleGenAI({ apiKey: key });
  const res = await ai.models.generateContent({
    model: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mime, data: image.toString("base64") } },
          { text: PROMPT(view, description) },
        ],
      },
    ],
  });
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img?.inlineData?.data) throw new Error(`Image model returned no image for ${view} view`);
  return Buffer.from(img.inlineData.data, "base64");
}
