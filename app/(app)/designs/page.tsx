import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/app/app.module.css";
import PageHead from "@/components/app/PageHead";
import DesignCard from "@/components/app/DesignCard";
import Icon from "@/components/Icon";
import { requireViewer } from "@/lib/auth/viewer";
import { listDesigns } from "@/lib/designs";

export const metadata: Metadata = { title: "Designs" };

export default async function Designs() {
  const viewer = await requireViewer();
  const designs = await listDesigns(viewer.id, 200);
  return (
    <>
      <PageHead icon="folder" title="Designs" sub={`${designs.length} in your library`} right={<Link href="/studio" className={styles.btn}><Icon d="wand" size={16} />New design</Link>} />
      {designs.length === 0 ? (
        <div className={styles.empty}>
          <Icon d="folder" size={28} />
          <b>Nothing here yet</b>
          <span>Designs you generate are saved here.</span>
        </div>
      ) : (
        <div className={styles.grid}>{designs.map((d) => <DesignCard key={d.id} d={d} />)}</div>
      )}
    </>
  );
}
