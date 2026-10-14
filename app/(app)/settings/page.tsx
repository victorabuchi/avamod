import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import styles from "@/components/app/app.module.css";
import PageHead from "@/components/app/PageHead";
import { isUnlimited, requireViewer } from "@/lib/auth/viewer";
import { pool } from "@/lib/db";

export const metadata: Metadata = { title: "Settings" };

export default async function Settings() {
  const viewer = await requireViewer();

  async function saveName(form: FormData) {
    "use server";
    const v = await requireViewer();
    const name = String(form.get("name") ?? "").trim().slice(0, 80);
    if (name) await pool.query("update users set name = $1 where id = $2", [name, v.id]);
    revalidatePath("/", "layout");
  }

  return (
    <>
      <PageHead icon="gear" title="Settings" sub="Account" />
      <section className={styles.card} style={{ maxWidth: 520 }}>
        <h2>Profile</h2>
        <form action={saveName} className={styles.form}>
          <label className={styles.field}>
            Name
            <input name="name" className={styles.input} defaultValue={viewer.name} required maxLength={80} />
          </label>
          <label className={styles.field}>
            Email
            <input className={styles.input} value={viewer.email} disabled readOnly />
          </label>
          <div><button className={styles.btn} type="submit">Save</button></div>
        </form>
      </section>
      <section id="plan" className={styles.card} style={{ maxWidth: 520 }}>
        <h2>Plan and credits</h2>
        <p style={{ margin: 0 }}>
          <span className={styles.badge}>{viewer.plan === "free" ? "Free" : viewer.plan === "admin" ? "Admin" : viewer.plan}</span>
          &nbsp; {isUnlimited(viewer) ? "Unlimited AI designs" : `${viewer.credits} AI design credits left`}
        </p>
        <p className={styles.muted} style={{ margin: 0 }}>Each AI design uses one credit. Paid plans with monthly credits are coming soon.</p>
      </section>
    </>
  );
}
