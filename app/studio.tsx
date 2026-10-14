"use client";

import { useState } from "react";

type Result = {
  id: string;
  mode: "ai" | "trace";
  notes: string[];
  spec: { name: string; garmentType: string; summary: string; primaryColor: string; fabric: string; construction: string[]; trims: string[]; measurements: { code: string; point: string; cm: number }[] };
  previews: { front: string; back?: string };
  files: { name: string; bytes: number }[];
};

const svgUrl = (s: string) => `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
const kb = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1e3)} KB`);

export function Studio() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [res, setRes] = useState<Result>();

  const pick = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setSrc(URL.createObjectURL(f));
    setRes(undefined);
    setError(undefined);
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(undefined);
    const fd = new FormData(e.currentTarget);
    fd.set("image", file);
    try {
      const r = await fetch("/api/generate", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Generation failed.");
      setRes(j);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700";

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
          className="flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 text-center text-sm text-neutral-500 hover:border-blue-600 dark:border-neutral-700"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src ? <img src={src} alt="Uploaded garment" className="h-full w-full object-contain" /> : <span className="px-6">Drop a garment photo here, or click to choose<br />PNG, JPG or WebP, up to 15 MB</span>}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        <input name="name" placeholder="Style name (optional)" className={field} />
        <textarea name="description" rows={3} placeholder="Describe it: oversized pullover hoodie, kangaroo pocket, drop shoulder, ribbed cuffs..." className={field} />
        <label className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          Colour override
          <input name="color" type="color" defaultValue="#c8c8c8" className="h-8 w-12 rounded border border-neutral-300 bg-transparent dark:border-neutral-700" />
        </label>
        <button disabled={!file || busy} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50">
          {busy ? "Generating... this can take a minute" : "Generate flat and tech pack"}
        </button>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>

      <section aria-live="polite">
        {!res ? (
          <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-neutral-200 text-sm text-neutral-500 dark:border-neutral-800">
            Your flat and downloads appear here.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {res.notes.map((n) => <p key={n} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">{n}</p>)}
            <div className="grid grid-cols-2 gap-4">
              {(["front", "back"] as const).map((v) => res.previews[v] && (
                <figure key={v} className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={svgUrl(res.previews[v]!)} alt={`${res.spec.name} ${v} flat`} className="w-full" />
                  <figcaption className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{v}</figcaption>
                </figure>
              ))}
            </div>
            <div>
              <h2 className="text-lg font-medium">{res.spec.name} <span className="text-sm font-normal text-neutral-500">{res.spec.garmentType}</span></h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{res.spec.summary}</p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {res.files.map((f) => (
                <li key={f.name}>
                  <a href={`/api/jobs/${res.id}/${f.name}`} download className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:border-blue-600 dark:border-neutral-800">
                    <span className="truncate">{f.name}</span>
                    <span className="ml-3 shrink-0 text-xs text-neutral-500">{kb(f.bytes)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
