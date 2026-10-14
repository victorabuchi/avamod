// Minimal SVG path support for the M/L/C/Z subset that potrace emits.
export type Seg =
  | { t: "M" | "L"; p: [number, number] }
  | { t: "C"; p: [number, number, number, number, number, number] }
  | { t: "Z" };

export function parsePath(d: string): Seg[] {
  const out: Seg[] = [];
  const re = /([MLCZ])([^MLCZ]*)/g;
  for (const m of d.matchAll(re)) {
    const nums = (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
    if (m[1] === "Z") out.push({ t: "Z" });
    else if (m[1] === "C") for (let i = 0; i + 5 < nums.length; i += 6) out.push({ t: "C", p: nums.slice(i, i + 6) as [number, number, number, number, number, number] });
    else for (let i = 0; i + 1 < nums.length; i += 2) out.push({ t: i === 0 ? m[1] as "M" | "L" : "L", p: [nums[i], nums[i + 1]] });
  }
  return out;
}

export type Xform = { x: number; y: number; scale: number; flipHeight: number | null };

/** PostScript / PDF path operators (same syntax: m l c h) with y-flip and scale. */
export function pathOps(d: string, f: Xform): string {
  const X = (v: number) => (f.x + v * f.scale).toFixed(2);
  const Y = (v: number) => (f.y + (f.flipHeight === null ? v : f.flipHeight - v) * f.scale).toFixed(2);
  return parsePath(d)
    .map((s) => {
      if (s.t === "Z") return "h";
      if (s.t === "C") return `${X(s.p[0])} ${Y(s.p[1])} ${X(s.p[2])} ${Y(s.p[3])} ${X(s.p[4])} ${Y(s.p[5])} c`;
      return `${X(s.p[0])} ${Y(s.p[1])} ${s.t === "M" ? "m" : "l"}`;
    })
    .join("\n");
}
