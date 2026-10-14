import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { Vectorized } from "@/lib/vector/vectorize";
import { pathOps } from "@/lib/vector/path";
import type { GarmentSpec } from "@/lib/spec";

const hexRgb = (c: string) => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => (x / 255).toFixed(4)).join(" ");
};

/** Draw the vector flat into a box on a page (box origin bottom-left, PDF units). */
export function drawFlat(pdf: PDFDocument, page: PDFPage, v: Vectorized, box: { x: number; y: number; w: number; h: number }) {
  const scale = Math.min(box.w / v.width, box.h / v.height);
  const x = box.x + (box.w - v.width * scale) / 2;
  const y = box.y + (box.h - v.height * scale) / 2;
  const f = { x, y, scale, flipHeight: v.height };
  const shape = (d: string, color: string) => `${hexRgb(color)} rg\n${pathOps(d, f)}\nf*\n`;
  const content = `q\n${shape(v.fillD, v.fillColor)}${shape(v.outlineD, "#000000")}Q\n`;
  const ref = pdf.context.register(pdf.context.stream(content));
  page.node.addContentStream(ref);
}

/** Single-page vector PDF of one flat. Also used (renamed) for the .ai file. */
export async function flatPdf(v: Vectorized, title: string) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setCreator("Flatsmith");
  const page = pdf.addPage([v.width, v.height]);
  drawFlat(pdf, page, v, { x: 0, y: 0, w: v.width, h: v.height });
  return Buffer.from(await pdf.save());
}

export async function techPackPdf(spec: GarmentSpec, views: { front: Vectorized; back?: Vectorized }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${spec.name} - Tech pack`);
  pdf.setCreator("Flatsmith");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595, H = 842, M = 36;
  const ink = rgb(0.1, 0.1, 0.12), mute = rgb(0.45, 0.45, 0.5), line = rgb(0.82, 0.82, 0.86);

  const wrap = (text: string, size: number, width: number) => {
    const words = text.split(/\s+/), lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) > width && cur) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, "");

  const header = (page: PDFPage, n: number) => {
    page.drawText(clean(spec.name).toUpperCase(), { x: M, y: H - M - 12, size: 16, font: bold, color: ink });
    page.drawText(`${clean(spec.garmentType)}  |  Size M sample  |  Page ${n}`, { x: M, y: H - M - 28, size: 8.5, font, color: mute });
    page.drawLine({ start: { x: M, y: H - M - 38 }, end: { x: W - M, y: H - M - 38 }, thickness: 0.8, color: ink });
  };

  // Page 1: flats
  const p1 = pdf.addPage([W, H]);
  header(p1, 1);
  const boxH = 470, boxY = H - M - 60 - boxH;
  const hasBack = !!views.back;
  const boxW = hasBack ? (W - 2 * M - 12) / 2 : W - 2 * M;
  drawFlat(pdf, p1, views.front, { x: M, y: boxY, w: boxW, h: boxH });
  p1.drawText("FRONT", { x: M, y: boxY - 14, size: 8, font: bold, color: mute });
  if (views.back) {
    drawFlat(pdf, p1, views.back, { x: M + boxW + 12, y: boxY, w: boxW, h: boxH });
    p1.drawText("BACK", { x: M + boxW + 12, y: boxY - 14, size: 8, font: bold, color: mute });
  }
  let y = boxY - 40;
  const fillRgb = (() => { const n = parseInt(spec.primaryColor.slice(1), 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); })();
  p1.drawRectangle({ x: M, y: y - 4, width: 22, height: 22, color: fillRgb, borderColor: ink, borderWidth: 0.6 });
  p1.drawText(`Main colour ${spec.primaryColor.toUpperCase()}`, { x: M + 30, y: y + 8, size: 9, font: bold, color: ink });
  p1.drawText(clean(`Fabric: ${spec.fabric}`), { x: M + 30, y: y - 3, size: 8.5, font, color: mute });
  y -= 34;
  for (const l of wrap(clean(spec.summary), 9, W - 2 * M)) {
    p1.drawText(l, { x: M, y, size: 9, font, color: ink });
    y -= 12;
  }

  // Page 2: spec
  const p2 = pdf.addPage([W, H]);
  header(p2, 2);
  y = H - M - 62;
  const section = (t: string) => { p2.drawText(t, { x: M, y, size: 10, font: bold, color: ink }); y -= 6; p2.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.4, color: line }); y -= 14; };

  section("POINTS OF MEASURE (CM, SIZE M)");
  for (const m of spec.measurements) {
    p2.drawText(m.code, { x: M, y, size: 9, font: bold, color: ink });
    p2.drawText(clean(m.point), { x: M + 24, y, size: 9, font, color: ink });
    p2.drawText(String(m.cm), { x: W - M - 40, y, size: 9, font: bold, color: ink });
    y -= 14;
  }
  y -= 12;
  const list = (title: string, items: string[]) => {
    if (!items.length) return;
    section(title);
    for (const it of items) for (const [i, l] of wrap(clean(it), 9, W - 2 * M - 14).entries()) {
      if (i === 0) p2.drawText("-", { x: M, y, size: 9, font, color: mute });
      p2.drawText(l, { x: M + 12, y, size: 9, font, color: ink });
      y -= 12;
    }
    y -= 10;
  };
  list("CONSTRUCTION", spec.construction);
  list("TRIMS & LABELS", spec.trims);
  p2.drawText("Measurements are estimates from a reference image. Verify against a physical sample before production.", { x: M, y: M, size: 7.5, font, color: mute });

  return Buffer.from(await pdf.save());
}
