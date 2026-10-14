import sharp from "sharp";
import { trace } from "potrace";

export type Vectorized = {
  width: number;
  height: number;
  fillD: string; // garment silhouette
  outlineD: string; // seams, outlines, topstitching
  shadeD?: string; // large solid dark areas (hood interior), drawn in a darker tone of the fabric
  fillColor: string;
  /** Seam colour; defaults to black. */
  outlineColor?: string;
  shadeColor?: string;
  /** A graphic placed on the garment, in viewBox units. */
  print?: { png: Buffer; x: number; y: number; w: number; h: number };
};

const WORK_SIZE = 1800;

function tracePath(mask: Buffer, opts: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) =>
    trace(mask, opts, (err, svg) => {
      if (err || !svg) return reject(err ?? new Error("trace failed"));
      resolve([...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join(" "));
    }),
  );
}

const LINE = 150; // luminance below this counts as outline ink

/**
 * Background = everything reachable from the image border without crossing the
 * garment outline. Works for white, transparent-flattened or checkerboard backdrops.
 * Ink is dilated by 1px so tiny gaps in the outline do not leak into the garment.
 */
function backgroundMask(lum: Uint8Array, w: number, h: number) {
  const ink = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (lum[y * w + x] < LINE)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) ink[ny * w + nx] = 1;
          }
  const bg = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (i: number) => {
    if (!bg[i] && !ink[i]) {
      bg[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }
  return bg;
}

/** Box filter via integral image: number of set pixels in the (2r+1) square around each pixel. */
function boxCount(mask: Uint8Array, w: number, h: number, r: number) {
  const W = w + 1;
  const sat = new Int32Array(W * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += mask[y * w + x];
      sat[(y + 1) * W + x + 1] = sat[y * W + x + 1] + row;
    }
  }
  const out = new Int32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
      out[y * w + x] = sat[y1 * W + x1] - sat[y0 * W + x1] - sat[y1 * W + x0] + sat[y0 * W + x0];
    }
  return out;
}

/** Dark pixels that belong to thick solid regions (not thin lines). */
function solidDark(dark: Uint8Array, w: number, h: number) {
  const R = 5;
  const full = (2 * R + 1) ** 2;
  const c = boxCount(dark, w, h, R);
  const core = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) core[i] = c[i] === full ? 1 : 0;
  const grown = boxCount(core, w, h, R + 1);
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = dark[i] && grown[i] > 0 ? 1 : 0;
  return solid;
}

export async function vectorize(input: Buffer, fillColor?: string): Promise<Vectorized> {
  const { data: rgb, info } = await sharp(input)
    .flatten({ background: "#ffffff" })
    .resize(WORK_SIZE, WORK_SIZE, { fit: "inside", withoutEnlargement: false })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;
  const lum = new Uint8Array(n);
  for (let i = 0; i < n; i++)
    lum[i] = (rgb[i * 3] * 299 + rgb[i * 3 + 1] * 587 + rgb[i * 3 + 2] * 114) / 1000;

  const bg = backgroundMask(lum, w, h);

  // black = shape for potrace
  const sil = Buffer.alloc(n);
  const line = Buffer.alloc(n, 255);
  const shade = Buffer.alloc(n, 255);
  const dark = new Uint8Array(n);
  const fillSamples: number[][] = [];
  for (let i = 0; i < n; i++) {
    sil[i] = bg[i] ? 255 : 0;
    if (!bg[i] && lum[i] < LINE) dark[i] = 1;
    else if (!bg[i] && lum[i] > 60 && i % 7 === 0) fillSamples.push([rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]]);
  }

  let color = fillColor;
  if (!color) {
    const med = (k: number) => fillSamples.map((s) => s[k]).sort((a, b) => a - b)[fillSamples.length >> 1] ?? 200;
    color = "#" + [0, 1, 2].map((k) => med(k).toString(16).padStart(2, "0")).join("");
  }

  const solid = solidDark(dark, w, h);
  for (let i = 0; i < n; i++) {
    if (solid[i]) shade[i] = 0;
    else if (dark[i]) line[i] = 0;
  }

  const png = (raw: Buffer) => sharp(raw, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
  const [silPng, linePng, shadePng] = await Promise.all([png(sil), png(line), png(shade)]);
  const [fillD, outlineD, shadeD] = await Promise.all([
    tracePath(silPng, { turdSize: 200, optTolerance: 0.4, threshold: 128 }),
    tracePath(linePng, { turdSize: 4, optTolerance: 0.3, alphaMax: 1, threshold: 128 }),
    tracePath(shadePng, { turdSize: 80, optTolerance: 0.4, threshold: 128 }).catch(() => ""),
  ]);
  return { width: w, height: h, fillD, outlineD, shadeD: shadeD || undefined, fillColor: color };
}
