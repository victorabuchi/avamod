"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/app/app.module.css";

export default function TemplateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    const form = e.currentTarget;
    try {
      const r = await fetch("/api/admin/templates", { method: "POST", body: new FormData(form) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Upload failed.");
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      <label className={styles.field}>Name<input name="name" className={styles.input} required maxLength={80} placeholder="Pullover Hoodie" /></label>
      <label className={styles.field}>Garment type<input name="garmentType" className={styles.input} required maxLength={60} placeholder="pullover hoodie" /></label>
      <label className={styles.field}>Description<textarea name="description" className={styles.input} rows={2} placeholder="Kangaroo pocket, hood with drawcord, ribbed cuffs and hem" /></label>
      <label className={styles.field}>Fabric<input name="fabric" className={styles.input} placeholder="80% cotton, 20% polyester, 380 gsm fleece" /></label>
      <label className={styles.field}>Front flat (PNG, JPG or WebP)<input name="front" type="file" accept="image/png,image/jpeg,image/webp" required /></label>
      <label className={styles.field}>Back flat <span className={styles.muted}>(optional)</span><input name="back" type="file" accept="image/png,image/jpeg,image/webp" /></label>
      <label className={styles.field}>Source files <span className={styles.muted}>(AI, PSD, SVG, PDF, DXF, anything; kept for you)</span><input name="files" type="file" multiple /></label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div><button className={styles.btn} disabled={busy}>{busy ? "Processing..." : "Add template"}</button></div>
    </form>
  );
}
