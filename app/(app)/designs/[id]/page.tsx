import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/app/app.module.css";
import PageHead from "@/components/app/PageHead";
import Icon from "@/components/Icon";
import { requireViewer } from "@/lib/auth/viewer";
import { getDesign, deleteDesign } from "@/lib/designs";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Design" };

const kb = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);

export default async function DesignPage({ params }: PageProps<"/designs/[id]">) {
  const viewer = await requireViewer();
  const { id } = await params;
  const d = await getDesign(viewer.id, id);
  if (!d) notFound();

  async function remove() {
    "use server";
    const v = await requireViewer();
    await deleteDesign(v.id, id);
    redirect("/designs");
  }

  const views = (["front", "back"] as const)
    .map((v) => [v, d.files.find((f) => f.name.endsWith(`-${v}.svg`))?.name] as const)
    .filter((x): x is readonly [typeof x[0], string] => !!x[1]);
  const url = (name: string, inline = false) => `/api/designs/${d.id}/${name}${inline ? "?inline=1" : ""}`;
  const zip = d.files.find((f) => f.name.endsWith("-all.zip"));

  return (
    <>
      <PageHead
        icon="layers"
        title={d.name}
        sub={d.garment_type}
        right={
          <>
            {zip && <a href={url(zip.name)} className={styles.btn}><Icon d="download" size={16} />Download all</a>}
            <Link href="/designs" className={styles.btnGhost}>All designs</Link>
          </>
        }
      />
      {d.notes.map((n) => <p key={n} className={styles.notice}>{n}</p>)}

      <div className={styles.previews}>
        {views.map(([v, name]) => (
          <figure key={v} className={styles.preview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url(name, true)} alt={`${d.name} ${v} flat`} />
            <figcaption>{v}</figcaption>
          </figure>
        ))}
      </div>

      <section className={styles.card}>
        <h2>Downloads</h2>
        <ul className={styles.files}>
          {d.files.filter((f) => !f.name.endsWith(".json")).map((f) => (
            <li key={f.name}>
              <a href={url(f.name)} className={styles.file} download>
                <Icon d="file" size={18} />
                <span>{f.name}</span>
                <small>{kb(f.bytes)}</small>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.card}>
        <h2>Spec</h2>
        <p className={styles.muted} style={{ margin: 0 }}>{d.summary}</p>
        <p style={{ margin: 0 }}>
          <span className={styles.swatch} style={{ background: d.color }} /> {d.color.toUpperCase()} · {d.spec.fabric}
        </p>
        <table className={styles.table}>
          <tbody>
            {d.spec.measurements.map((m) => (
              <tr key={m.code}><td>{m.code} · {m.point}</td><td>{m.cm} cm</td></tr>
            ))}
          </tbody>
        </table>
        {d.spec.construction.length > 0 && <ul className={styles.steps}>{d.spec.construction.map((c) => <li key={c}>{c}</li>)}</ul>}
      </section>

      <form action={remove}>
        <button className={styles.btnGhost} type="submit"><Icon d="trash" size={16} />Delete design</button>
      </form>
    </>
  );
}
