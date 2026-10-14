import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

// File storage behind a tiny interface. Local disk for now; swap the body for
// S3/R2 (put/get/remove by design id + file name) when deploying to several servers.
const ROOT = process.env.STORAGE_DIR ?? path.join(process.cwd(), ".data", "designs");
const UUID = /^[0-9a-f-]{36}$/;

const dir = (id: string) => {
  if (!UUID.test(id)) throw new Error("bad design id");
  return path.join(ROOT, id);
};

export async function putFiles(id: string, files: Record<string, Buffer>) {
  await mkdir(dir(id), { recursive: true });
  await Promise.all(Object.entries(files).map(([n, b]) => writeFile(path.join(dir(id), path.basename(n)), b)));
}

export async function getFile(id: string, name: string): Promise<Buffer | null> {
  if (!UUID.test(id) || name !== path.basename(name)) return null;
  return readFile(path.join(dir(id), name)).catch(() => null);
}

export async function removeDesign(id: string) {
  await rm(dir(id), { recursive: true, force: true });
}

export const MIME: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  pdf: "application/pdf",
  ai: "application/pdf",
  eps: "application/postscript",
  psd: "image/vnd.adobe.photoshop",
  zip: "application/zip",
  json: "application/json",
};
