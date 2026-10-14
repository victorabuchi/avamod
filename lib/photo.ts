import sharp from "sharp";
import type { BBox } from "@/lib/vector/geometry";
import { shoulderFraction } from "@/lib/flat";

export type PhotoAnalysis = {
  /** Fabric colour as #rrggbb (median of the garment body, edges and prints excluded). */
  color: string;
  /** Garment bounding box as fractions of the photo. */
  bbox: BBox;
  /** Shoulder line as a fraction of the garment height (see shoulderFraction). */
  shoulder: number;
  /** Width / height of the garment in the photo. */
  aspect: number;
  /** A graphic printed on the garment, cut out with transparency. */
  print?: { png: Buffer; rel: BBox };
};

const SIZE = 700;

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const hex = (c: number[]) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const median = (xs: number[]) => xs.sort((a, b) => a - b)[xs.length >> 1] ?? 0;

/** Label 4-connected components of a mask; returns the id map and pixel counts. */
function components(mask: Uint8Array, w: number, h: number) {
  const id = new Int32Array(w * h);
  const sizes: number[] = [0];
  const stack: number[] = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || id[s]) continue;
    const label = sizes.length;
    let n = 0;
    id[s] = label;
    stack.push(s);
    while (stack.length) {
      const i = stack.pop()!;
      n++;
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i < w * (h - 1) ? i + w : -1]) {
        if (j >= 0 && mask[j] && !id[j]) {
          id[j] = label;
          stack.push(j);
        }
      }
    }
    sizes.push(n);
  }
  return { id, sizes };
}

function erode(mask: Uint8Array, w: number, h: number, r: number) {
  const out = new Uint8Array(w * h);
  for (let y = r; y < h - r; y++)
    for (let x = r; x < w - r; x++) {
      const i = y * w + x;
      out[i] = mask[i] && mask[i - r] && mask[i + r] && mask[i - r * w] && mask[i + r * w] && mask[i - r * w - r] && mask[i + r * w + r] ? 1 : 0;
    }
  return out;
}

function dilate(mask: Uint8Array, w: number, h: number, r: number) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      for (let dy = -r; dy <= r; dy += 2)
        for (let dx = -r; dx <= r; dx += 2) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) out[ny * w + nx] = 1;
        }
    }
  return out;
}

function rowWidths(mask: Uint8Array, w: number, y0: number, y1: number) {
  const rows: number[] = [];
  for (let y = y0; y <= y1; y++) {
    let c = 0;
    for (let x = 0; x < w; x++) c += mask[y * w + x];
    rows.push(c);
  }
  return rows;
}

export async function analyzePhoto(input: Buffer): Promise<PhotoAnalysis> {
  const { data, info } = await sharp(input, { limitInputPixels: false })
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize(SIZE, SIZE, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (i: number) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];

  // Background colour = median of the photo border.
  const border: number[][] = [];
  for (let x = 0; x < w; x++) border.push(px(x), px((h - 1) * w + x));
  for (let y = 0; y < h; y++) border.push(px(y * w), px(y * w + w - 1));
  const bg = [0, 1, 2].map((k) => median(border.map((c) => c[k])));

  // Garment = pixels unlike the background, largest connected piece only.
  const raw = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) raw[i] = dist(px(i), bg) > 34 ? 1 : 0;
  const { id, sizes } = components(raw, w, h);
  let best = 1;
  for (let k = 2; k < sizes.length; k++) if (sizes[k] > sizes[best]) best = k;
  const mask = new Uint8Array(w * h);
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let i = 0; i < w * h; i++)
    if (id[i] === best) {
      mask[i] = 1;
      const x = i % w, y = (i / w) | 0;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;

  // Fabric colour from the eroded interior.
  const inner = erode(mask, w, h, 9);
  const samples: number[][] = [];
  for (let i = 0; i < w * h; i += 3) if (inner[i]) samples.push(px(i));
  const base = samples.length ? [0, 1, 2].map((k) => median(samples.map((c) => c[k]))) : [200, 200, 200];

  const result: PhotoAnalysis = {
    color: hex(base),
    bbox: { x: x0 / w, y: y0 / h, w: bw / w, h: bh / h },
    aspect: bw / bh,
    shoulder: shoulderFraction(rowWidths(mask, w, y0, y1)),
  };

  // Print = interior pixels far from the fabric colour, grouped; keep the biggest group near the chest.
  const far = new Uint8Array(w * h);
  let farCount = 0;
  for (let i = 0; i < w * h; i++)
    if (inner[i] && dist(px(i), base) > 70) {
      far[i] = 1;
      farCount++;
    }
  if (farCount > w * h * 0.0006) {
    const grown = dilate(far, w, h, 14);
    const cc = components(grown, w, h);
    const count = new Map<number, number>();
    for (let i = 0; i < w * h; i++) if (far[i]) count.set(cc.id[i], (count.get(cc.id[i]) ?? 0) + 1);
    // Prefer the largest group whose centre sits in the middle of the garment (skips sleeve graphics).
    let pick = 0, pickN = 0;
    for (const [label, n] of count) {
      let sx = 0, sn = 0;
      for (let i = 0; i < w * h; i += 5) if (far[i] && cc.id[i] === label) { sx += i % w; sn++; }
      const cx = sn ? sx / sn : 0;
      const central = cx > x0 + bw * 0.25 && cx < x0 + bw * 0.75;
      if (central && n > pickN) { pick = label; pickN = n; }
    }
    if (pick && pickN > w * h * 0.0004) {
      let px0 = w, py0 = h, px1 = 0, py1 = 0;
      for (let i = 0; i < w * h; i++)
        if (far[i] && cc.id[i] === pick) {
          const x = i % w, y = (i / w) | 0;
          px0 = Math.min(px0, x); px1 = Math.max(px1, x); py0 = Math.min(py0, y); py1 = Math.max(py1, y);
        }
      const pad = 3;
      px0 = Math.max(0, px0 - pad); py0 = Math.max(0, py0 - pad); px1 = Math.min(w - 1, px1 + pad); py1 = Math.min(h - 1, py1 + pad);
      const cw = px1 - px0 + 1, ch = py1 - py0 + 1;
      const rgba = Buffer.alloc(cw * ch * 4);
      for (let y = 0; y < ch; y++)
        for (let x = 0; x < cw; x++) {
          const i = (py0 + y) * w + (px0 + x);
          const d = dist(px(i), base);
          const a = inner[i] ? Math.max(0, Math.min(1, (d - 45) / 35)) : 0;
          const o = (y * cw + x) * 4;
          rgba[o] = data[i * 3]; rgba[o + 1] = data[i * 3 + 1]; rgba[o + 2] = data[i * 3 + 2]; rgba[o + 3] = Math.round(a * 255);
        }
      result.print = {
        png: await sharp(rgba, { raw: { width: cw, height: ch, channels: 4 } }).png().toBuffer(),
        rel: { x: (px0 - x0) / bw, y: (py0 - y0) / bh, w: cw / bw, h: ch / bh },
      };
    }
  }
  return result;
}
