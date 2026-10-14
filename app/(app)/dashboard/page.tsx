import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/app/app.module.css";
import PageHead from "@/components/app/PageHead";
import DesignCard from "@/components/app/DesignCard";
import Icon from "@/components/Icon";
import { isUnlimited, requireViewer } from "@/lib/auth/viewer";
import { designStats, listDesigns } from "@/lib/designs";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const viewer = await requireViewer();
  const [stats, recent] = await Promise.all([designStats(viewer.id), listDesigns(viewer.id, 8)]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHead icon="home" title={`${greeting}, ${viewer.name.split(" ")[0]}`} sub="Overview" />

      <div className={styles.cta}>
        <div>
          <h2>Turn a photo into a tech pack</h2>
          <p>Upload any garment. Get the vector flat, measurements and every export format.</p>
        </div>
        <Link href="/studio" className={styles.btn}>
          <Icon d="wand" size={16} />
          New design
        </Link>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <small>Designs</small>
          <b>{stats?.designs ?? 0}</b>
          <span>in your library</span>
        </div>
        <div className={styles.stat}>
          <small>Files exported</small>
          <b>{stats?.files ?? 0}</b>
          <span>SVG, PNG, PDF, AI, EPS, PSD</span>
        </div>
        <div className={styles.stat}>
          <small>Credits left</small>
          <b>{isUnlimited(viewer) ? "Unlimited" : viewer.credits}</b>
          <span>{viewer.plan === "free" ? "Free plan" : viewer.plan === "admin" ? "Admin, all features" : `${viewer.plan} plan`}</span>
        </div>
      </div>

      <div className={styles.sectionHead}>
        <h2>Recent designs</h2>
        {recent.length > 0 && <Link href="/designs">View all</Link>}
      </div>
      {recent.length === 0 ? (
        <div className={styles.empty}>
          <Icon d="layers" size={28} />
          <b>No designs yet</b>
          <span>Your first flat takes about a minute.</span>
          <Link href="/studio" className={styles.btn}>Create your first design</Link>
        </div>
      ) : (
        <div className={styles.grid}>{recent.map((d) => <DesignCard key={d.id} d={d} />)}</div>
      )}
    </>
  );
}
