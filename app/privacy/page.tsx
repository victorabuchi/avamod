import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="14 October 2026">
      <h2>What we collect</h2>
      <p>Your name, email address and a hashed password; the images and descriptions you upload; and the designs and files we generate for you.</p>
      <h2>How we use it</h2>
      <p>To run your account and produce your designs. To generate a design, your image and description are sent to our AI providers for processing. We do not sell your data and do not use your uploads to advertise to you.</p>
      <h2>Where it is kept</h2>
      <p>Your account data is stored in our database and your design files in our file storage. Passwords are never stored in readable form.</p>
      <h2>Your choices</h2>
      <p>You can delete any design from your library at any time. To delete your account and all its data, contact us and we will do it.</p>
    </LegalPage>
  );
}
