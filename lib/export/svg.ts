import type { Vectorized } from "@/lib/vector/vectorize";

export type Layer = "fill" | "outline";

export function svgDoc(v: Vectorized, layers: Layer[] = ["fill", "outline"], title = "Flat") {
  const g = (id: string, d: string, color: string) =>
    `<g id="${id}"><path d="${d}" fill="${color}" fill-rule="evenodd"/></g>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${v.width}" height="${v.height}" viewBox="0 0 ${v.width} ${v.height}">
<title>${title.replace(/[<&]/g, "")}</title>
${layers.includes("fill") ? g("fill", v.fillD, v.fillColor) : ""}
${layers.includes("outline") ? g("outline", v.outlineD, "#000000") : ""}
</svg>
`;
}
