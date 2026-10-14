import Link from "next/link";
import styles from "./app.module.css";
import type { Design } from "@/lib/designs";

export const frontFile = (d: Pick<Design, "files">) => d.files.find((f) => f.name.endsWith("-front.svg"))?.name;

export default function DesignCard({ d }: { d: Design }) {
  const front = frontFile(d);
  return (
    <Link href={`/designs/${d.id}`} className={styles.design}>
      <span className={styles.thumb}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {front && <img src={`/api/designs/${d.id}/${front}?inline=1&v=${d.version}`} alt={`${d.name} flat`} loading="lazy" />}
      </span>
      <span className={styles.designMeta}>
        <b>{d.name}</b>
        <small>{d.garment_type} · {d.created_at.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</small>
      </span>
    </Link>
  );
}
