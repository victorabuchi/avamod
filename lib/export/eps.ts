import type { Vectorized } from "@/lib/vector/vectorize";
import { pathOps } from "@/lib/vector/path";

function hex(c: string) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => (x / 255).toFixed(4)).join(" ");
}

export function epsDoc(v: Vectorized, title: string) {
  const f = { x: 0, y: 0, scale: 1, flipHeight: v.height };
  const shape = (d: string, color: string) =>
    `${hex(color)} setrgbcolor\nnewpath\n${pathOps(d, f)}\neofill\n`;
  return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${v.width} ${v.height}
%%Title: ${title.replace(/[()\\\n]/g, "")}
%%Creator: Flatsmith
%%EndComments
gsave
${shape(v.fillD, v.fillColor)}${shape(v.outlineD, "#000000")}grestore
showpage
%%EOF
`;
}
