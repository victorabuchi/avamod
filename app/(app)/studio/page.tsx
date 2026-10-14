import type { Metadata } from "next";
import PageHead from "@/components/app/PageHead";
import Studio from "./Studio";
import { isUnlimited, requireViewer } from "@/lib/auth/viewer";
import { listTemplates } from "@/lib/templates";
import { aiEnabled } from "@/lib/ai/generate-flat";

export const metadata: Metadata = { title: "New design" };

export default async function StudioPage() {
  const viewer = await requireViewer();
  const templates = (await listTemplates()).map((t) => ({ id: t.id, name: t.name }));
  return (
    <>
      <PageHead icon="wand" title="New design" sub="Photo to tech pack" />
      <Studio credits={isUnlimited(viewer) ? 999999 : viewer.credits} templates={templates} aiRedraw={aiEnabled()} />
    </>
  );
}
