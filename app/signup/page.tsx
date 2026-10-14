import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";
import styles from "@/components/auth/auth.module.css";
import { getViewer } from "@/lib/auth/viewer";
import { signupAction } from "@/lib/auth/actions";
import { FREE_CREDITS, HOME } from "@/lib/auth/constants";

export const metadata: Metadata = { title: "Create account" };

const ERRORS: Record<string, string> = {
  invalid: "Enter your name and a valid email address.",
  short: "Use a password of at least 8 characters.",
  taken: "An account with that email already exists. Log in instead.",
};

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  if (await getViewer()) redirect(HOME);
  const params = await searchParams;
  const one = (k: string) => (typeof params[k] === "string" ? params[k] : "");
  const error = ERRORS[one("error")];

  return (
    <AuthShell
      title="Create your account"
      lede={`Start free with ${FREE_CREDITS} AI designs. No card needed.`}
      below={<>Already have an account? <Link href="/login">Log in</Link></>}
    >
      {error && <p className={styles.error} role="alert">{error}</p>}
      <form action={signupAction} className={styles.form}>
        <label className={styles.field}>
          Name
          <input className={styles.input} name="name" autoComplete="name" required maxLength={80} />
        </label>
        <label className={styles.field}>
          Email
          <input className={styles.input} type="email" name="email" autoComplete="username" inputMode="email" defaultValue={one("email")} required />
        </label>
        <PasswordField label="Password" autoComplete="new-password" hint="At least 8 characters." />
        <button className={styles.button} type="submit">Create account</button>
        <p className={styles.fine}>By creating an account you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
      </form>
    </AuthShell>
  );
}
