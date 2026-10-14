"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/app/app.module.css";
import Icon from "@/components/Icon";

type Mode = "template" | "redraw";

export default function Studio({ credits, templates, aiRedraw }: { credits: number; templates: { id: string; name: string }[]; aiRedraw: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string>();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [mode, setMode] = useState<Mode>("template");

  const pick = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setSrc(URL.createObjectURL(f));
    setError(undefined);
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(undefined);
    const fd = new FormData(e.currentTarget);
    fd.set("image", file);
    fd.set("mode", mode);
    try {
      const r = await fetch("/api/designs", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Generation failed.");
      router.push(`/designs/${j.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
      setBusy(false);
    }
  }

  const needsCredit = mode === "template" || aiRedraw;
  const blocked = (needsCredit && credits < 1) || (mode === "template" && templates.length === 0);

  return (
    <div className={styles.studio}>
      <form onSubmit={submit} className={`${styles.card} ${styles.form}`}>
        <div className={styles.modes} role="tablist" aria-label="How to build the design">
          <button type="button" role="tab" aria-selected={mode === "template"} data-on={mode === "template"} onClick={() => setMode("template")}>
            <b>Match a template</b>
            <small>Adapt one of your finished flats to the photo</small>
          </button>
          <button type="button" role="tab" aria-selected={mode === "redraw"} data-on={mode === "redraw"} onClick={() => setMode("redraw")}>
            <b>Redraw from photo</b>
            <small>AI draws a fresh flat from the picture</small>
          </button>
        </div>
        <label
          className={styles.drop}
          data-over={over}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Uploaded garment" />
          ) : (
            <span>
              <Icon d="upload" size={26} />
              <b>Drop a garment photo</b>
              <small>or click to choose · PNG, JPG, WebP · up to 15 MB</small>
            </span>
          )}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        <label className={styles.field}>
          <span>Style name <span className={styles.muted}>(optional)</span></span>
          <input name="name" className={styles.input} maxLength={80} />
        </label>
        <label className={styles.field}>
          Describe it
          <textarea name="description" rows={3} className={styles.input} placeholder="Oversized pullover hoodie, kangaroo pocket, drop shoulder, ribbed cuffs" />
        </label>
        {mode === "template" ? (
          <label className={styles.field}>
            Garment template
            <select name="templateId" className={styles.input} defaultValue="">
              <option value="">Match automatically</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
        ) : (
          <label className={`${styles.field} ${styles.row}`} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            Colour override
            <input name="color" type="color" defaultValue="#c8c8c8" />
          </label>
        )}
        <button className={styles.btn} disabled={!file || busy || blocked} style={{ height: 42 }}>
          {busy ? "Building your design..." : "Create design"}
        </button>
        {needsCredit && credits < 1 && <p className={styles.error}>You are out of credits. <a href="/settings#plan">See plans</a></p>}
        {mode === "template" && templates.length === 0 && <p className={styles.error}>No templates yet. Add some under Templates.</p>}
        {mode === "redraw" && !aiRedraw && <p className={styles.muted} style={{ margin: 0 }}>AI redraw is not switched on, so the photo is traced as it is. That only works for images that are already flat drawings.</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </form>

      <section className={styles.card}>
        <h2>{mode === "template" ? "Match a template" : "Redraw from photo"}</h2>
        {mode === "template" ? (
          <>
            <ol className={styles.steps}>
              <li>Upload a photo of the garment you want, for example from a store site.</li>
              <li>Avamod matches the closest template and copies the colour, fit and any chest graphic.</li>
              <li>Review it, then change colour, fit, print position and measurements in the editor.</li>
              <li>Download SVG, 300 DPI PNG, PDF, AI, EPS, a layered PSD and the tech pack.</li>
            </ol>
            <p className={styles.muted} style={{ margin: 0 }}>Best when you want production-clean vectors. Each new design uses one credit; editing is free.</p>
          </>
        ) : (
          <>
            <ol className={styles.steps}>
              <li>Upload a photo of any garment, including pieces you have no template for.</li>
              <li>AI redraws it as a clean front and back flat, then converts it to real vector paths.</li>
              <li>Download the same set of files, plus a tech pack with estimated measurements.</li>
            </ol>
            <p className={styles.muted} style={{ margin: 0 }}>Best for garments outside your template library. The result is a fresh drawing, so check the details against the photo.</p>
          </>
        )}
      </section>
    </div>
  );
}
