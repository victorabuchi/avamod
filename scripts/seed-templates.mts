// DEV ONLY. Loads flats from a local folder as templates so the matching flow can be tried.
//   PACK="$HOME/Downloads/S.i. Graphics - FREE Streetwear Mockup Pack" npx tsx --tsconfig tsconfig.json scripts/seed-templates.mts
// The S.i. Graphics free pack is licensed for personal use only: never commit it or serve it
// to customers. Production templates must be files you own or hold a commercial licence for.
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ingestTemplate } from "../lib/templates";
import { pool } from "../lib/db";

const PACK = process.env.PACK;
if (!PACK) throw new Error("Set PACK to the folder containing 'FREE PNG MOCKUPS'");

const ITEMS: Array<[string, string, string]> = [
  ["Pullover Hoodie", "pullover hoodie", "Kangaroo pocket pullover hoodie with hood and ribbed cuffs and hem."],
  ["Zip Hoodie", "zip hoodie", "Full-zip hoodie with hood and side pockets."],
  ["Puffer Jacket", "puffer jacket", "Quilted puffer jacket."],
  ["Sweat Pants", "sweatpants", "Jogger-style sweatpants with elastic waistband and cuffs."],
  ["Tee Shirt", "t-shirt", "Crew neck short sleeve tee."],
  ["Crewneck", "crewneck sweatshirt", "Crewneck sweatshirt with ribbed cuffs and hem."],
  ["Shorts", "shorts", "Casual shorts."],
];

for (const [file, type, description] of ITEMS) {
  const png = path.join(PACK, "FREE PNG MOCKUPS", `${file}.png`);
  if (!existsSync(png)) continue;
  const sourceFiles: Record<string, Buffer> = { [`${file}.png`]: readFileSync(png) };
  const ai = path.join(PACK, "BONUS – 3 AI EDITABLE FILES", `${file}.ai`);
  if (existsSync(ai)) sourceFiles[`${file}.ai`] = readFileSync(ai);
  const t = Date.now();
  const id = await ingestTemplate({ name: file, garmentType: type, description, front: readFileSync(png), sourceFiles });
  console.log("seeded", file, id, `${Date.now() - t}ms`);
}
await pool.end();
