"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./app.module.css";
import Icon, { type IconName } from "@/components/Icon";

export const NAV: Array<[IconName, string, string]> = [
  ["home", "Dashboard", "/dashboard"],
  ["wand", "New design", "/studio"],
  ["folder", "Designs", "/designs"],
];

export function Rail({ admin = false }: { admin?: boolean }) {
  const path = usePathname();
  const item = (icon: IconName, label: string, href: string) => (
    <Link key={href} href={href} className={styles.railItem} data-active={path.startsWith(href)} aria-label={label} aria-current={path.startsWith(href) ? "page" : undefined}>
      <Icon d={icon} size={20} />
      <span>{label}</span>
    </Link>
  );
  return (
    <nav className={styles.rail} aria-label="Main">
      {NAV.map(([i, l, h]) => item(i, l, h))}
      {admin && item("layers", "Templates", "/admin/templates")}
      <span className={styles.railSpacer} />
      {item("gear", "Settings", "/settings")}
    </nav>
  );
}

export function Tabs({ admin = false }: { admin?: boolean }) {
  const path = usePathname();
  return (
    <nav className={styles.tabs} aria-label="Main">
      {[...NAV, ...(admin ? [["layers", "Templates", "/admin/templates"] as [IconName, string, string]] : []), ["gear", "Settings", "/settings"] as [IconName, string, string]].map(([icon, label, href]) => (
        <Link key={href} href={href} className={styles.tabItem} data-active={path.startsWith(href)} aria-current={path.startsWith(href) ? "page" : undefined}>
          <Icon d={icon} size={20} />
          <small>{label}</small>
        </Link>
      ))}
    </nav>
  );
}
