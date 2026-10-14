import Link from "next/link";
import styles from "./app.module.css";
import Mark from "@/components/Mark";
import Icon from "@/components/Icon";
import Popover from "./Popover";
import { Rail, Tabs } from "./Nav";
import { signOutAction } from "@/lib/auth/actions";
import { isUnlimited, type Viewer } from "@/lib/auth/viewer";

export default function AppShell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  return (
    <div className={styles.app}>
      <header className={styles.top}>
        <Link href="/dashboard" className={styles.mark} aria-label="Avamod home">
          <Mark size={20} />
        </Link>
        <span className={styles.slash}>/</span>
        <span className={styles.orgName}>Avamod</span>
        <span className={styles.topRight}>
          <Link href="/settings#plan" className={styles.credits} title="AI design credits left">
            <Icon d="zap" size={15} />
            {isUnlimited(viewer) ? "Unlimited" : <>{viewer.credits} <span className={styles.hideSm}>credits</span></>}
          </Link>
          <Link href="/studio" className={`${styles.btn} ${styles.hideSm}`}>
            <Icon d="wand" size={16} />
            New design
          </Link>
          <Popover label="Account" className={styles.avatar} button={viewer.name.slice(0, 1).toUpperCase()}>
            <div className={styles.popHead}>
              <b>{viewer.name}</b>
              <small>{viewer.email}</small>
            </div>
            <Link href="/settings" className={styles.popItem}>
              <Icon d="gear" />
              Settings
            </Link>
            <form action={signOutAction}>
              <button type="submit" className={styles.popItem}>
                <Icon d="out" />
                Log out
              </button>
            </form>
          </Popover>
        </span>
      </header>
      <div className={styles.body}>
        <Rail admin={isUnlimited(viewer)} />
        <main className={styles.main}>{children}</main>
      </div>
      <Tabs admin={isUnlimited(viewer)} />
    </div>
  );
}
