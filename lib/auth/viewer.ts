import { cache } from "react";
import { redirect } from "next/navigation";
import { one } from "@/lib/db";
import { readSession } from "./session";

// Admin accounts have every feature with no credit limit.
export const isUnlimited = (v: Pick<Viewer, "plan">) => v.plan === "admin";

export type Viewer = { id: string; email: string; name: string; plan: string; credits: number };

/** The signed-in user, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const s = await readSession();
  if (!s) return null;
  return one<Viewer>("select id, email, name, plan, credits from users where id = $1", [s.userId]);
});

export async function requireViewer(): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect("/login");
  return v;
}

export async function requireAdmin(): Promise<Viewer> {
  const v = await requireViewer();
  if (!isUnlimited(v)) redirect("/dashboard");
  return v;
}
