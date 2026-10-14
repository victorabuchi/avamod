// Pure helpers shared by the server renderer and the browser editor (no Node imports).

/** Everything the editor can change. Stored on the design, so edits are repeatable. */
export type Params = {
  color: string;
  /** Garment width and length multipliers, 1 = the template as drawn. */
  fit: { w: number; l: number };
  /** Graphic on the chest: centre and width as fractions of the flat's width/height; aspect = height / width. */
  print?: { enabled: boolean; cx: number; cy: number; w: number; aspect: number };
  /** Measurements typed in by hand, by point code. They win over the fit-derived value. */
  overrides: Record<string, number>;
};

export type Measurement = { code: string; point: string; cm: number };

export const FIT_MIN = 0.8;
export const FIT_MAX = 1.25;
/** Empty margin around the template, as a fraction of its size, so wider fits are never clipped. */
export const PAD = 0.14;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

/** Dark fabrics get light seam lines so the construction stays readable. */
export const outlineFor = (color: string) => (lum(color) < 0.22 ? "#a3acba" : "#000000");

/** Solid dark areas (hood interior) in a deeper tone of the fabric. */
export function shadeFor(color: string) {
  const n = parseInt(color.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * 0.45));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

export const axisOf = (point: string): "w" | "l" | null =>
  /length|sleeve|rise|inseam|height/i.test(point) ? "l" : /width|chest|shoulder|waist|hip|bicep|cuff|hem|thigh|opening|neck/i.test(point) ? "w" : null;

export function measurementsFor(base: Measurement[], p: Params): Measurement[] {
  return base.map((m) => {
    const axis = axisOf(m.point);
    const factor = axis === "w" ? p.fit.w : axis === "l" ? p.fit.l : 1;
    return { ...m, cm: p.overrides[m.code] ?? Math.round(m.cm * factor * 10) / 10 };
  });
}

/**
 * Row where the shoulders start, as a fraction of the garment's height: the first row whose
 * width reaches 55% of the widest row. Used to line a photo up with a template.
 */
export function shoulderFraction(rowWidths: number[]): number {
  const max = Math.max(...rowWidths, 1);
  const i = rowWidths.findIndex((w) => w >= max * 0.55);
  return i < 0 ? 0.3 : Math.min(0.6, Math.max(0.08, i / rowWidths.length));
}

/** Map a vertical position on the photo's garment to the template's, anchored at the shoulder line and the hem. */
export function mapY(photoY: number, photoShoulder: number, templateShoulder: number): number {
  if (photoY <= photoShoulder) return (photoY / photoShoulder) * templateShoulder;
  return templateShoulder + ((photoY - photoShoulder) / (1 - photoShoulder)) * (1 - templateShoulder);
}
