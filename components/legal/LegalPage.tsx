import Link from "next/link";
import Mark from "@/components/Mark";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--card)" }}>
      <header style={{ borderBottom: "1px solid var(--line)", padding: "14px 20px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 18, textDecoration: "none" }}>
          <span style={{ display: "grid", placeItems: "center", width: 32, height: 32, borderRadius: 9, background: "var(--accent)" }}><Mark size={19} /></span>
          Avamod
        </Link>
      </header>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px", fontSize: 15.5, lineHeight: 1.65 }}>
        <h1 style={{ margin: 0, fontSize: 32, letterSpacing: "-0.03em" }}>{title}</h1>
        <p style={{ color: "var(--muted)" }}>Last updated {updated}</p>
        {children}
      </main>
    </div>
  );
}
