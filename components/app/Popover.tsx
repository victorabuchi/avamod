"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./app.module.css";

// A click-to-open menu that closes on outside click and Escape.
export default function Popover({ label, className, button, children }: { label: string; className: string; button: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <span className={styles.popWrap} ref={ref}>
      <button type="button" className={className} aria-label={label} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {button}
      </button>
      {open && (
        <div className={styles.pop} onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          {children}
        </div>
      )}
    </span>
  );
}
