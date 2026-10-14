import { redirect } from "next/navigation";
import Landing from "@/components/landing/Landing";
import { getViewer } from "@/lib/auth/viewer";
import { HOME } from "@/lib/auth/constants";

export default async function Home() {
  if (await getViewer()) redirect(HOME);
  return <Landing />;
}
