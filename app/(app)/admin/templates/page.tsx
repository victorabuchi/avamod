import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import styles from "@/components/app/app.module.css";
import PageHead from "@/components/app/PageHead";
import TemplateForm from "./TemplateForm";
import { requireAdmin } from "@/lib/auth/viewer";
import { listTemplates } from "@/lib/templates";
import { pool } from "@/lib/db";
import { removeDesign } from "@/lib/storage";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Templates" };

export default async function Templates() {
  await requireAdmin();
  const templates = await listTemplates(true);

  async function toggle(form: FormData) {
    "use server";
    await requireAdmin();
    await pool.query("update templates set active = not active where id = $1", [String(form.get("id"))]);
    revalidatePath("/admin/templates");
  }
  async function remove(form: FormData) {
    "use server";
    await requireAdmin();
    const id = String(form.get("id"));
    if ((await pool.query("delete from templates where id = $1", [id])).rowCount) await removeDesign(id);
    revalidatePath("/admin/templates");
  }

  return (
    <>
      <PageHead icon="layers" title="Templates" sub="Your finished flats and tech packs" />
      <p className={styles.notice}>
        Only upload files you own or are licensed to distribute. Designers get the flat adapted from these, and the original source files stay with you.
      </p>
      <div className={styles.grid}>
        {templates.map((t) => (
          <div key={t.id} className={styles.design} style={{ opacity: t.active ? 1 : 0.55 }}>
            <span className={styles.thumb}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/templates/${t.id}`} alt={`${t.name} flat`} loading="lazy" />
            </span>
            <span className={styles.designMeta}>
              <b>{t.name}</b>
              <small>{t.garment_type}{t.views.back ? " · front and back" : " · front"} · {t.files.length} source file{t.files.length === 1 ? "" : "s"}</small>
              <span className={styles.row} style={{ marginTop: 6 }}>
                <form action={toggle}><input type="hidden" name="id" value={t.id} /><button className={styles.btnGhost} style={{ height: 30 }}>{t.active ? "Hide" : "Show"}</button></form>
                <form action={remove}><input type="hidden" name="id" value={t.id} /><button className={styles.btnGhost} style={{ height: 30 }} aria-label={`Delete ${t.name}`}><Icon d="trash" size={14} /></button></form>
              </span>
            </span>
          </div>
        ))}
      </div>
      <section className={styles.card} style={{ maxWidth: 560 }}>
        <h2>Add a template</h2>
        <TemplateForm />
      </section>
    </>
  );
}
