import { parsePath } from "./path";

export type BBox = { x: number; y: number; w: number; h: number };

export function pathBBox(d: string): BBox {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of parsePath(d)) {
    if (s.t === "Z") continue;
    for (let i = 0; i < s.p.length; i += 2) {
      x0 = Math.min(x0, s.p[i]);
      x1 = Math.max(x1, s.p[i]);
      y0 = Math.min(y0, s.p[i + 1]);
      y1 = Math.max(y1, s.p[i + 1]);
    }
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Scale path coordinates by (sx, sy) about the point (ox, oy). */
export function scalePath(d: string, sx: number, sy: number, ox: number, oy: number): string {
  if (sx === 1 && sy === 1) return d;
  const X = (v: number) => (ox + (v - ox) * sx).toFixed(2);
  const Y = (v: number) => (oy + (v - oy) * sy).toFixed(2);
  return parsePath(d)
    .map((s) => {
      if (s.t === "Z") return "Z";
      if (s.t === "C") return `C ${X(s.p[0])} ${Y(s.p[1])}, ${X(s.p[2])} ${Y(s.p[3])}, ${X(s.p[4])} ${Y(s.p[5])}`;
      return `${s.t} ${X(s.p[0])} ${Y(s.p[1])}`;
    })
    .join(" ");
}
