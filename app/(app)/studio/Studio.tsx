"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/app/app.module.css";
import Icon from "@/components/Icon";

export default function Studio({ credits, templates }: { credits: number; templates: { id: string; name: string }[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string>();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

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

  const blocked = credits < 1 || templates.length === 0;

  return (
    <div className={styles.studio}>
      <form onSubmit={submit} className={`${styles.card} ${styles.form}`}>
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
        <label className={styles.field}>
          Garment template
          <select name="templateId" className={styles.input} defaultValue="">
            <option value="">Match automatically</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <button className={styles.btn} disabled={!file || busy || blocked} style={{ height: 42 }}>
          {busy ? "Building your design..." : "Create design"}
        </button>
        {credits < 1 && <p className={styles.error}>You are out of credits. <a href="/settings#plan">See plans</a></p>}
        {templates.length === 0 && <p className={styles.error}>No templates yet. Add some under Templates.</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </form>

      <section className={styles.card}>
        <h2>How it works</h2>
        <ol className={styles.steps}>
          <li>Upload a photo of the garment you want, for example from a store site.</li>
          <li>Avamod matches the closest template and copies the colour, fit and any chest graphic.</li>
          <li>Review it, then change colour, fit, print position and measurements in the editor.</li>
          <li>Download SVG, 300 DPI PNG, PDF, AI, EPS, a layered PSD and the tech pack.</li>
        </ol>
        <p className={styles.muted} style={{ margin: 0 }}>
          Works best with a front-on product photo on a plain background. Each new design uses one credit; editing is free.
        </p>
      </section>
    </div>
  );
}
