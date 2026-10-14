import AppShell from "@/components/app/AppShell";
import { requireViewer } from "@/lib/auth/viewer";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await requireViewer();
  return <AppShell viewer={viewer}>{children}</AppShell>;
}
