import type { Vectorized } from "@/lib/vector/vectorize";

export type Layer = "fill" | "print" | "outline";

export function svgDoc(v: Vectorized, layers: Layer[] = ["fill", "print", "outline"], title = "Flat") {
  const g = (id: string, d: string, color: string) =>
    `<g id="${id}"><path d="${d}" fill="${color}" fill-rule="evenodd"/></g>`;
  const print =
    v.print && layers.includes("print")
      ? `<g id="print"><image x="${v.print.x.toFixed(1)}" y="${v.print.y.toFixed(1)}" width="${v.print.w.toFixed(1)}" height="${v.print.h.toFixed(1)}" href="data:image/png;base64,${v.print.png.toString("base64")}"/></g>`
      : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${v.width}" height="${v.height}" viewBox="0 0 ${v.width} ${v.height}">
<title>${title.replace(/[<&]/g, "")}</title>
${layers.includes("fill") ? g("fill", v.fillD, v.fillColor) + (v.shadeD ? g("shade", v.shadeD, v.shadeColor ?? "#000000") : "") : ""}
${print}
${layers.includes("outline") ? g("outline", v.outlineD, v.outlineColor ?? "#000000") : ""}
</svg>
`;
}
