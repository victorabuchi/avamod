import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHead from "@/components/app/PageHead";
import Editor from "./Editor";
import { requireViewer } from "@/lib/auth/viewer";
import { getDesign, PRINT, REFERENCE } from "@/lib/designs";
import { getTemplate } from "@/lib/templates";

export const metadata: Metadata = { title: "Edit design" };

export default async function EditPage({ params }: PageProps<"/designs/[id]/edit">) {
  const viewer = await requireViewer();
  const { id } = await params;
  const d = await getDesign(viewer.id, id);
  const t = d?.template_id ? await getTemplate(d.template_id) : null;
  if (!d || !t) notFound();
  return (
    <>
      <PageHead icon="wand" title="Edit design" sub={`${d.name} · version ${d.version}`} />
      <Editor
        id={d.id}
        initialName={d.name}
        initialParams={d.params}
        views={t.views}
        baseMeasurements={t.measurements}
        hasPrint={d.files.some((f) => f.name === PRINT)}
        hasReference={d.files.some((f) => f.name === REFERENCE)}
      />
    </>
  );
}
