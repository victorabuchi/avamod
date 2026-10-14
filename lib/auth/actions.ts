"use server";

import { redirect } from "next/navigation";
import { one, pool } from "@/lib/db";
import { burnPasswordCheck, hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "./password";
import { clearFailures, isThrottled, recordFailure } from "./throttle";
import { createSession, destroySession } from "./session";
import { FREE_CREDITS, HOME } from "./constants";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (path: string, error: string, email = "") =>
  redirect(`${path}?error=${error}${email ? `&email=${encodeURIComponent(email)}` : ""}`);

export async function signupAction(form: FormData) {
  const name = text(form, "name").slice(0, 80);
  const email = text(form, "email").toLowerCase().slice(0, 254);
  const password = String(form.get("password") ?? "");
  if (!name || !EMAIL.test(email)) return back("/signup", "invalid", email);
  if (password.length < MIN_PASSWORD_LENGTH) return back("/signup", "short", email);
  if (password.length > 200) return back("/signup", "invalid", email);

  const hash = await hashPassword(password);
  const client = await pool.connect();
  let id: string;
  try {
    await client.query("begin");
    const r = await client.query<{ id: string }>(
      "insert into users (email, name, password_hash, credits) values ($1, $2, $3, $4) on conflict do nothing returning id",
      [email, name, hash, FREE_CREDITS],
    );
    if (!r.rows[0]) {
      await client.query("rollback");
      return back("/signup", "taken", email);
    }
    id = r.rows[0].id;
    await client.query("insert into credit_ledger (user_id, delta, reason) values ($1, $2, 'signup')", [id, FREE_CREDITS]);
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
  await createSession(id);
  redirect(HOME);
}

export async function loginAction(form: FormData) {
  const email = text(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return back("/login", "missing", email);
  if (isThrottled(email)) return back("/login", "throttled", email);

  const user = await one<{ id: string; password_hash: string }>("select id, password_hash from users where lower(email) = $1", [email]);
  if (!user) {
    await burnPasswordCheck(password);
    recordFailure(email);
    return back("/login", "invalid", email);
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    recordFailure(email);
    return back("/login", "invalid", email);
  }
  clearFailures(email);
  await createSession(user.id);
  redirect(HOME);
}

export async function signOutAction() {
  await destroySession();
  redirect("/login");
}
