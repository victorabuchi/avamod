import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="14 October 2026">
      <h2>Your account</h2>
      <p>You are responsible for your account and for keeping your password safe. You must give accurate details when you sign up.</p>
      <h2>Your content</h2>
      <p>You keep ownership of the images you upload and the designs you generate. You confirm you have the right to upload each image, and that it does not infringe anyone else&apos;s rights. You give Avamod permission to process your images to produce your designs.</p>
      <h2>Acceptable use</h2>
      <p>Do not use Avamod to copy a garment in order to pass it off as another brand&apos;s product, to break the law, or to disrupt the service.</p>
      <h2>Credits and plans</h2>
      <p>AI designs use credits. Free credits have no cash value and may change. Paid plans, when offered, will be described at purchase.</p>
      <h2>No warranty</h2>
      <p>Measurements and construction notes are estimates generated from a photo. Check them against a physical sample before production. The service is provided as is, and our liability is limited to the extent the law allows.</p>
      <h2>Ending your account</h2>
      <p>You can stop using Avamod at any time. We may suspend accounts that break these terms.</p>
    </LegalPage>
  );
}
