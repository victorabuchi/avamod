import Anthropic from "@anthropic-ai/sdk";
import { GarmentSpec, defaultMeasurements } from "@/lib/spec";

const MODEL = process.env.ANALYZE_MODEL ?? "claude-sonnet-5-5";

export async function analyzeGarment(
  image: Buffer,
  mime: string,
  description: string,
  hint?: { name?: string; color?: string },
): Promise<GarmentSpec> {
  const fallback: GarmentSpec = {
    name: hint?.name || "Untitled style",
    garmentType: guessType(description),
    summary: description || "No description provided.",
    primaryColor: hint?.color || "#c8c8c8",
    fabric: "To be confirmed",
    construction: [],
    trims: [],
    measurements: defaultMeasurements(description),
  };
  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mime as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
              data: image.toString("base64"),
            },
          },
          {
            type: "text",
            text: `You are a technical designer preparing a garment tech pack from a reference photo.
Designer's notes: ${description || "(none)"}
Reply with ONLY a JSON object, no prose, with this shape:
{"name": string, "garmentType": string (e.g. "pullover hoodie"), "summary": string (2 sentences),
 "primaryColor": "#rrggbb" (the main garment colour in the photo, unless the notes override it),
 "fabric": string (likely composition and weight), "construction": string[] (seams, stitching, pocket, hood, cuff, hem, closure details you can see),
 "trims": string[] (drawcords, eyelets, zips, labels, prints),
 "measurements": [{"code":"A","point":string,"cm":number}] (size M points of measure for this garment type, 6-10 rows)}`,
          },
        ],
      },
    ],
  });
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const parsed = GarmentSpec.safeParse(JSON.parse(json));
  if (!parsed.success) return fallback;
  return { ...parsed.data, name: hint?.name || parsed.data.name, primaryColor: hint?.color || parsed.data.primaryColor };
}

function guessType(d: string) {
  const m = d.toLowerCase().match(/(hoodie|tracksuit|track jacket|jogger|sweatpants|pants|t-?shirt|tee|jacket|puffer|shorts)/);
  return m ? m[1] : "garment";
}
