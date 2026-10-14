"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/app/app.module.css";
import Icon from "@/components/Icon";

export default function Studio({ credits, costsCredit }: { credits: number; costsCredit: boolean }) {
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
      const r = await fetch("/api/generate", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Generation failed.");
      router.push(`/designs/${j.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
      setBusy(false);
    }
  }

  const blocked = costsCredit && credits < 1;

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
          Style name <span className={styles.muted}>(optional)</span>
          <input name="name" className={styles.input} maxLength={80} />
        </label>
        <label className={styles.field}>
          Describe it
          <textarea name="description" rows={3} className={styles.input} placeholder="Oversized pullover hoodie, kangaroo pocket, drop shoulder, ribbed cuffs" />
        </label>
        <label className={`${styles.field} ${styles.row}`} style={{ flexDirection: "row", justifyContent: "space-between" }}>
          Colour override
          <input name="color" type="color" defaultValue="#c8c8c8" />
        </label>
        <button className={styles.btn} disabled={!file || busy || blocked} style={{ height: 42 }}>
          {busy ? "Generating... about a minute" : costsCredit ? "Generate (1 credit)" : "Generate"}
        </button>
        {blocked && <p className={styles.error}>You are out of credits. <a href="/settings#plan">See plans</a></p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </form>

      <section className={styles.card}>
        <h2>What you get</h2>
        <ol className={styles.steps}>
          <li>A clean front and back flat, redrawn from your photo.</li>
          <li>Vector files: SVG, PDF, AI and EPS.</li>
          <li>A 300 DPI transparent PNG and a layered PSD.</li>
          <li>A tech pack PDF with measurements, construction and trims.</li>
        </ol>
        <p className={styles.muted} style={{ margin: 0 }}>
          Works best with a front-on product photo on a plain background. Flat sketches are traced exactly as drawn.
        </p>
      </section>
    </div>
  );
}
