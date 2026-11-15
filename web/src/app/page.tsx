import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { ArrowRight, BellRing, Bot, Languages, ListChecks, MapPinned, Monitor, ScanLine, Smartphone, Users } from "lucide-react";
import "./landing.css";

export const metadata: Metadata = { title: { absolute: "farmagusta: the robot fleet for sample delivery" } };

const KIT_PATH = "/kit?start=1";
const NURSE_PATH = "/nurse";

/** The address this page was served from, so the QR code works on production, previews and a LAN dev server. */
async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "farmagusta.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function StartPage() {
  const kitUrl = `${await origin()}${KIT_PATH}`;
  const qr = await QRCode.toString(kitUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0b1f33", light: "#ffffff" } });

  return (
    <main id="main-content" tabIndex={-1} className="fg-page">
      <section className="fg-hero">
        <div className="fg-wrap">
          <header className="fg-top">
            <span className="fg-mark">farmagusta<span className="fg-dot">.</span></span>
            <span className="fg-pill"><span className="fg-live" aria-hidden />Junction 2026 · live demo</span>
          </header>

          <div className="fg-hero-grid">
            <div>
              <p className="fg-eyebrow">The robot fleet for sample delivery</p>
              <h1 className="fg-title">Bowel screening, collected from the door.</h1>
              <p className="fg-lede">
                A third of the people invited to bowel cancer screening in Helsinki never send the test back.
                farmagusta guides them through it in their own language, sends a robot to collect the sample,
                and shows the nurse everyone who falls behind.
              </p>
              <p className="fg-lede fg-lede-small">
                The demo is two apps that share one live event log: what you do on the phone appears on the dashboard
                as it happens.
              </p>
            </div>
            <RouteScene />
          </div>
        </div>
      </section>

      <section className="fg-wrap fg-cards" aria-label="The two apps">
        <article className="fg-card">
          <div className="fg-card-head">
            <span className="fg-icon"><Smartphone aria-hidden size={22} /></span>
            <span className="fg-badge">Best on a phone</span>
          </div>
          <h2 className="fg-card-title">The patient app</h2>
          <p className="fg-card-who">For the person invited to screening, aged 56–74.</p>
          <ul className="fg-list">
            <li><Languages aria-hidden size={18} />Choose from nine languages, Arabic and Persian right to left</li>
            <li><ListChecks aria-hidden size={18} />Ten illustrated steps for taking the sample at home</li>
            <li><Bot aria-hidden size={18} />Book a robot and watch it arrive at the door</li>
          </ul>

          <Link href={KIT_PATH} className="fg-btn fg-btn-primary fg-phone-only">
            Open the patient app <ArrowRight aria-hidden size={18} />
          </Link>

          <div className="fg-qr-row fg-desktop-only">
            <div className="fg-qr" role="img" aria-label={`QR code for ${kitUrl}`} dangerouslySetInnerHTML={{ __html: qr }} />
            <div className="fg-qr-text">
              <p className="fg-qr-title"><ScanLine aria-hidden size={18} />Scan with your phone camera</p>
              <p className="fg-qr-sub">That’s how a real invitation letter would open it.</p>
              <Link href={KIT_PATH} className="fg-textlink">Or open it in this browser <ArrowRight aria-hidden size={16} /></Link>
            </div>
          </div>
        </article>

        <article className="fg-card fg-card-dark">
          <div className="fg-card-head">
            <span className="fg-icon"><Monitor aria-hidden size={22} /></span>
            <span className="fg-badge">Best on a desktop</span>
          </div>
          <h2 className="fg-card-title">The nurse dashboard</h2>
          <p className="fg-card-who">For the screening nurse who follows everyone up.</p>
          <ul className="fg-list">
            <li><Users aria-hidden size={18} />Every patient by stage, with their language and interpreter need</li>
            <li><BellRing aria-hidden size={18} />Flags who falls behind: no sample, robot waiting, no colonoscopy</li>
            <li><MapPinned aria-hidden size={18} />The robot fleet live on a map of Helsinki, Espoo and Vantaa</li>
          </ul>
          <MiniMap />
          <Link href={NURSE_PATH} className="fg-btn fg-btn-light">
            Open the dashboard <ArrowRight aria-hidden size={18} />
          </Link>
        </article>
      </section>

      <section className="fg-wrap fg-together" aria-labelledby="together">
        <h2 id="together" className="fg-together-title">Best of all: try them together</h2>
        <ol className="fg-steps">
          <li><span className="fg-step-n">1</span>Open the dashboard on your laptop.</li>
          <li><span className="fg-step-n">2</span>Scan the code with your phone, take the “sample” and book a pickup.</li>
          <li><span className="fg-step-n">3</span>Watch your robot appear on the nurse’s map.</li>
        </ol>
      </section>

      <footer className="fg-wrap fg-foot">
        <p>
          A Junction 2026 prototype for AstraZeneca’s <i>Equal Care Across Finland</i> challenge.
          The people are invented; the robots, the lab and the bookings are simulated.
        </p>
        <a href="https://github.com/rromppanen/junction26" className="fg-textlink">Source on GitHub <ArrowRight aria-hidden size={16} /></a>
      </footer>
    </main>
  );
}

/** A robot rolling from a home to the lab along a dashed route. Decorative. */
function RouteScene() {
  return (
    <div className="fg-scene" aria-hidden>
      <svg viewBox="0 0 520 260" className="fg-scene-svg">
        <path d="M140 194 C 200 194, 190 110, 262 110 S 330 178, 378 168" className="fg-route" />
        {/* home */}
        <g transform="translate(36 150)">
          <path d="M0 30 L34 0 L68 30 V72 H0 Z" className="fg-house" />
          <rect x="26" y="44" width="16" height="28" rx="2" className="fg-door" />
          <circle cx="34" cy="-14" r="5" className="fg-ping" />
        </g>
        {/* lab */}
        <g transform="translate(420 92)">
          <rect x="0" y="10" width="78" height="64" rx="8" className="fg-lab" />
          <rect x="31" y="24" width="16" height="36" rx="2" className="fg-cross" />
          <rect x="21" y="34" width="36" height="16" rx="2" className="fg-cross" />
        </g>
        {/* robot */}
        <g className="fg-robot">
          <line x1="44" y1="-2" x2="44" y2="-38" className="fg-mast" />
          <path d="M44 -38 L62 -32 L44 -26 Z" className="fg-flag" />
          <rect x="0" y="0" width="64" height="34" rx="12" className="fg-body" />
          <rect x="0" y="12" width="64" height="8" className="fg-band" />
          <circle cx="12" cy="38" r="7" className="fg-wheel" />
          <circle cx="32" cy="38" r="7" className="fg-wheel" />
          <circle cx="52" cy="38" r="7" className="fg-wheel" />
        </g>
      </svg>
      <div className="fg-scene-tag"><span className="fg-live" />FG-07 · en route to lab · sample ×1</div>
    </div>
  );
}

/** A small abstract fleet map: hubs, routes and robots. Decorative. */
function MiniMap() {
  return (
    <svg viewBox="0 0 360 120" className="fg-minimap" aria-hidden>
      <path d="M20 90 C 80 40, 140 100, 200 60 S 300 30, 340 70" className="fg-mm-route" />
      <path d="M40 20 C 90 50, 120 30, 180 90" className="fg-mm-route fg-mm-faint" />
      {[[60, 64], [200, 60], [300, 44], [120, 52], [250, 80]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" className="fg-mm-robot" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
      <rect x="168" y="80" width="12" height="12" rx="2" className="fg-mm-hub" />
      <circle cx="320" cy="96" r="6" className="fg-mm-flag" />
    </svg>
  );
}
