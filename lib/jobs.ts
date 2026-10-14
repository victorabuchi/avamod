import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ROOT = path.join(process.cwd(), ".data", "jobs");
const ID = /^[0-9a-f-]{36}$/;

export async function saveJob(files: Record<string, Buffer>) {
  const id = randomUUID();
  const dir = path.join(ROOT, id);
  await mkdir(dir, { recursive: true });
  await Promise.all(Object.entries(files).map(([n, b]) => writeFile(path.join(dir, n), b)));
  return id;
}

export async function readJobFile(id: string, file: string) {
  if (!ID.test(id) || file !== path.basename(file)) return null;
  const dir = path.join(ROOT, id);
  if (!(await readdir(dir).catch(() => [] as string[])).includes(file)) return null;
  return readFile(path.join(dir, file));
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
