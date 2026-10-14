import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Template } from "@/lib/templates";

export type Match = {
  template: Template;
  how: "ai" | "chosen" | "keywords";
  name?: string;
  summary?: string;
  fabric?: string;
  construction: string[];
  trims: string[];
};

const MODEL = process.env.MATCH_MODEL ?? "claude-sonnet-5-5";

const Reply = z.object({
  templateId: z.string(),
  name: z.string().optional(),
  summary: z.string().optional(),
  fabric: z.string().optional(),
  construction: z.array(z.string()).default([]),
  trims: z.array(z.string()).default([]),
});

const KEYWORDS: Array<[RegExp, RegExp]> = [
  [/zip/, /zip/],
  [/pant|jogger|sweatpant|trouser/, /pant/],
  [/short/, /short/],
  [/puffer|jacket|quilt/, /puffer|jacket/],
  [/crew/, /crew/],
  [/tee|t-shirt|tshirt/, /tee|t-shirt/],
  [/hood/, /pullover|hood/],
];

function byKeywords(text: string, templates: Template[]) {
  const t = text.toLowerCase();
  for (const [ask, has] of KEYWORDS) {
    if (!ask.test(t)) continue;
    const hit = templates.find((x) => has.test(`${x.name} ${x.garment_type}`.toLowerCase()));
    if (hit) return hit;
  }
  return templates[0];
}

/** Pick the template that best fits the photo, and read the garment details off it. */
export async function matchTemplate(
  photo: Buffer,
  mime: "image/png" | "image/jpeg" | "image/webp" | "image/gif",
  description: string,
  templates: Template[],
  chosenId?: string,
): Promise<Match> {
  const chosen = chosenId ? templates.find((t) => t.id === chosenId) : undefined;
  const empty = { construction: [], trims: [] };

  if (!process.env.ANTHROPIC_API_KEY) {
    return chosen ? { template: chosen, how: "chosen", ...empty } : { template: byKeywords(description, templates), how: "keywords", ...empty };
  }

  const list = templates.map((t) => `- id ${t.id}: ${t.name} (${t.garment_type}). ${t.description}`).join("\n");
  const res = await new Anthropic().messages.create({
    model: MODEL,
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mime, data: photo.toString("base64") } },
          {
            type: "text",
            text: `You are a technical designer. This photo shows a garment a customer wants made.
Designer notes: ${description || "(none)"}
${chosen ? `The customer already chose the template "${chosen.name}"; use id ${chosen.id}.` : "Pick the template below that matches the garment's cut and construction best."}
Templates:
${list}

Reply with ONLY JSON: {"templateId": string, "name": string (short style name), "summary": string (2 sentences on the look and fit),
"fabric": string (likely composition and weight), "construction": string[] (visible seams, pockets, hood, cuffs, hem, closures, stitching),
"trims": string[] (drawcords, eyelets, zips, labels, prints)}`,
          },
        ],
      },
    ],
  });
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const parsed = Reply.safeParse(JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)));
  if (!parsed.success) return { template: chosen ?? byKeywords(description, templates), how: chosen ? "chosen" : "keywords", ...empty };
  const template = chosen ?? templates.find((t) => t.id === parsed.data.templateId) ?? byKeywords(description, templates);
  return { template, how: "ai", ...parsed.data };
}
