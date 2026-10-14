import type { Metadata } from "next";
import PageHead from "@/components/app/PageHead";
import Studio from "./Studio";
import { requireViewer } from "@/lib/auth/viewer";
import { aiEnabled } from "@/lib/ai/generate-flat";

export const metadata: Metadata = { title: "New design" };

export default async function StudioPage() {
  const viewer = await requireViewer();
  return (
    <>
      <PageHead icon="wand" title="New design" sub="Photo to tech pack" />
      <Studio credits={viewer.credits} costsCredit={aiEnabled()} />
    </>
  );
}
