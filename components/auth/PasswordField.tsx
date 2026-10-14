"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import styles from "./auth.module.css";

export default function PasswordField({ label, autoComplete, hint }: { label: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className={styles.field}>
      {label}
      <span className={styles.passwordWrap}>
        <input className={styles.input} type={show ? "text" : "password"} name="password" autoComplete={autoComplete} required minLength={8} />
        <button type="button" className={styles.eye} onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
          <Icon d={show ? "eyeOff" : "eye"} />
        </button>
      </span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}
