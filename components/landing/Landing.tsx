import Link from "next/link";
import styles from "./landing.module.css";
import Mark from "@/components/Mark";
import Icon, { type IconName } from "@/components/Icon";

const FEATURES: Array<{ icon: IconName; title: string; desc: string }> = [
  { icon: "image", title: "Two ways to build", desc: "Match the photo to a finished template and adapt it, or have AI redraw any garment from the picture. Same files out of both." },
  { icon: "layers", title: "True vector files", desc: "Not a traced screenshot. Separate fill and outline layers you can edit in Illustrator, Photoshop or Figma." },
  { icon: "ruler", title: "Tech pack included", desc: "Points of measure, construction notes, trims and fabric, laid out as a PDF you can send to a factory." },
  { icon: "file", title: "Every format", desc: "SVG, 300 DPI transparent PNG, PDF, AI, EPS and a layered PSD from a single upload." },
  { icon: "wand", title: "Front and back", desc: "The back view is inferred from the front, so you get the full set of flats without a second photo." },
  { icon: "zap", title: "Minutes, not days", desc: "What used to be a day of pen-tool work is one upload and about a minute of waiting." },
];

const FORMATS = ["SVG", "PNG 300 DPI", "PDF", "AI", "EPS", "PSD", "Tech pack PDF"];

export default function Landing() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={`${styles.wrap} ${styles.navInner}`}>
          <Link href="/" className={styles.wordmark}>
            <span className={styles.tile}><Mark size={20} /></span>
            Avamod
          </Link>
          <nav className={styles.links} aria-label="Sections">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className={styles.actions}>
            <Link href="/login" className={styles.btnGhost}>Log in</Link>
            <Link href="/signup" className={styles.btn}>Start free</Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.aurora} aria-hidden="true" />
        <div className={styles.wrap}>
          <span className={styles.eyebrow}>Garment flats and tech packs, automated</span>
          <h1>Upload a garment. <span>Get the tech pack.</span></h1>
          <p className={styles.lede}>
            Save a hoodie from any website, upload it, and Avamod gives you the exact flat as vector files, plus a tech pack with measurements and construction details.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/signup" className={`${styles.btnHero} ${styles.big}`}>Start free</Link>
            <a href="#how" className={`${styles.btnHeroGhost} ${styles.big}`}>How it works</a>
          </div>
          <p className={styles.heroNote}>3 free AI designs. No card needed.</p>

          <div className={styles.shot} aria-hidden="true">
            <div className={styles.shotBar}>
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
              <span style={{ marginLeft: 8 }}>Pullover Hoodie</span>
            </div>
            <div className={styles.shotBody}>
              <div className={styles.shotCard}>
                <h3>Front flat</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sample-hoodie.svg" alt="" />
              </div>
              <div className={styles.shotCard}>
                <h3>Points of measure (cm)</h3>
                {[["A · Body length", 68], ["B · Chest width", 58], ["C · Shoulder width", 52], ["D · Sleeve length", 66], ["E · Cuff width", 9], ["F · Pocket width", 30]].map(([k, v]) => (
                  <div key={k} className={styles.pom}><span>{k}</span><b>{v}</b></div>
                ))}
                <h3 style={{ marginTop: 8 }}>Construction</h3>
                <div className={styles.pom}><span>Kangaroo pocket, topstitched</span></div>
                <div className={styles.pom}><span>Ribbed cuffs and hem</span></div>
              </div>
              <div className={styles.shotCard}>
                <h3>Exports</h3>
                <div className={styles.chips}>{FORMATS.map((f) => <span key={f} className={styles.chip}>{f}</span>)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={styles.section}>
        <div className={styles.wrap}>
          <p className={styles.kicker}>Features</p>
          <h2>Everything a flat sketch needs, from one photo</h2>
          <div className={styles.features}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.feature}>
                <span className={styles.ico}><Icon d={f.icon} size={22} /></span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className={`${styles.section} ${styles.alt}`}>
        <div className={styles.wrap}>
          <p className={styles.kicker}>How it works</p>
          <h2>Three steps, about a minute</h2>
          <div className={styles.how}>
            <div className={styles.step}><h3>Upload</h3><p>Drop in a photo of the garment and add a line of description if you want to steer it.</p></div>
            <div className={styles.step}><h3>Avamod redraws it</h3><p>It reads the garment, draws the front and back flats, and converts them to real vector paths.</p></div>
            <div className={styles.step}><h3>Download</h3><p>Take the files you need, or the whole pack as a zip. Your designs stay in your library.</p></div>
          </div>
          <div className={styles.formats}>{FORMATS.map((f) => <span key={f} className={styles.format}>{f}</span>)}</div>
        </div>
      </section>

      <section id="pricing" className={styles.section}>
        <div className={styles.wrap}>
          <p className={styles.kicker}>Pricing</p>
          <h2>Start free, pay when you scale</h2>
          <p className={styles.sub}>Each AI design uses one credit. Tracing a flat you already have is free.</p>
          <div className={styles.plans}>
            <div className={styles.plan} data-hot="true">
              <h3>Free</h3>
              <div className={styles.price}>$0</div>
              <ul><li>3 AI designs to start</li><li>Unlimited tracing of existing flats</li><li>All export formats</li></ul>
              <Link href="/signup" className={styles.btn}>Start free</Link>
            </div>
            <div className={styles.plan}>
              <h3>Pro</h3>
              <div className={styles.price}>Soon</div>
              <ul><li>Monthly AI design credits</li><li>Priority generation</li><li>Custom tech pack branding</li></ul>
              <span className={styles.soon}>Coming soon</span>
            </div>
            <div className={styles.plan}>
              <h3>Studio</h3>
              <div className={styles.price}>Soon</div>
              <ul><li>Team workspaces</li><li>Shared design library</li><li>API access</li></ul>
              <span className={styles.soon}>Coming soon</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.closing}>
        <div className={styles.wrap}>
          <h2>Your next collection starts with a photo</h2>
          <Link href="/signup" className={`${styles.btnHero} ${styles.big}`}>Start free</Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <span>© {new Date().getFullYear()} Avamod</span>
          <span>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/login">Log in</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
