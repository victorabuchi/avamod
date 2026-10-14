import { z } from "zod";

export const GarmentSpec = z.object({
  name: z.string(),
  garmentType: z.string(),
  summary: z.string(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fabric: z.string(),
  construction: z.array(z.string()),
  trims: z.array(z.string()),
  measurements: z.array(
    z.object({ code: z.string(), point: z.string(), cm: z.number() }),
  ),
});
export type GarmentSpec = z.infer<typeof GarmentSpec>;

// Size M points of measure, used when the vision model is unavailable
// and as the prior the model is asked to adjust.
const POM: Record<string, GarmentSpec["measurements"]> = {
  hoodie: [
    { code: "A", point: "Body length (HPS to hem)", cm: 68 },
    { code: "B", point: "Chest width (2.5cm below armhole)", cm: 58 },
    { code: "C", point: "Shoulder width", cm: 52 },
    { code: "D", point: "Sleeve length (from shoulder)", cm: 66 },
    { code: "E", point: "Bicep width", cm: 22 },
    { code: "F", point: "Cuff width (relaxed)", cm: 9 },
    { code: "G", point: "Hem width (relaxed)", cm: 44 },
    { code: "H", point: "Hood height", cm: 36 },
    { code: "I", point: "Pocket width", cm: 30 },
  ],
  pants: [
    { code: "A", point: "Waist (relaxed)", cm: 38 },
    { code: "B", point: "Hip", cm: 56 },
    { code: "C", point: "Front rise", cm: 29 },
    { code: "D", point: "Inseam", cm: 76 },
    { code: "E", point: "Thigh width", cm: 33 },
    { code: "F", point: "Leg opening", cm: 18 },
  ],
  tee: [
    { code: "A", point: "Body length (HPS to hem)", cm: 71 },
    { code: "B", point: "Chest width", cm: 54 },
    { code: "C", point: "Shoulder width", cm: 47 },
    { code: "D", point: "Sleeve length", cm: 21 },
    { code: "E", point: "Neck opening", cm: 19 },
  ],
};

export function defaultMeasurements(garmentType: string) {
  const t = garmentType.toLowerCase();
  if (/(pant|trouser|jogger|short|bottom)/.test(t)) return POM.pants;
  if (/(tee|t-shirt|shirt|top|tank)/.test(t) && !/hood/.test(t)) return POM.tee;
  return POM.hoodie;
}
