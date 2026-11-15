import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { ArrowRight } from "lucide-react";
import robot from "./_landing/robot.jpg";
import "./landing.css";

export const metadata: Metadata = { title: { absolute: "farmagusta: bowel screening, collected from the door" } };

const KIT_PATH = "/kit?start=1";
const NURSE_PATH = "/nurse";

/** The address this page was served from, so the QR code works on production, previews and a LAN dev server. */
async function origin(): Promise<{ url: string; host: string }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "farmagusta.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? (isLoopback(host) ? "http" : "https");
  return { url: `${proto}://${host}`, host };
}

/** A phone that scans the code cannot reach the laptop's own loopback address. */
function isLoopback(host: string): boolean {
  return /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(host);
}

export default async function StartPage() {
  const { url, host } = await origin();
  const kitUrl = `${url}${KIT_PATH}`;
  const qr = await QRCode.toString(kitUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1d252c", light: "#ffffff" } });

  return (
    <main id="main-content" tabIndex={-1} className="fg">
      <section className="fg-hero">
        <Image src={robot} alt="" fill priority sizes="100vw" placeholder="blur" className="fg-hero-photo" />
        <div className="fg-hero-shade" aria-hidden />
        <div className="fg-wrap fg-hero-text">
          <p className="fg-wordmark">
            farmagusta<span className="fg-dot" aria-hidden>.</span>
          </p>
          <h1 className="fg-title">Bowel screening, collected from the door.</h1>
        </div>
        <div className="fg-tag" aria-hidden>
          <p><span className="fg-led" />FG-07 · en route to lab</p>
          <p>Payload&nbsp; FIT sample ×1</p>
          <p>Pickup&nbsp;&nbsp; front door</p>
        </div>
      </section>

      <section className="fg-wrap fg-doors" aria-label="Open the demo">
        <article className="fg-door">
          <p className="fg-kicker">01 · Best on a phone</p>
          <h2 className="fg-door-title">Patient app</h2>
          <p className="fg-door-text">
            Your language, picture steps, a robot at the door.
          </p>

          <Link href={KIT_PATH} className="fg-btn">
            Open the patient app <ArrowRight aria-hidden size={18} />
          </Link>

          <div className="fg-scan fg-wide-only">
            <div className="fg-qr" role="img" aria-label={`QR code that opens ${kitUrl}`} dangerouslySetInnerHTML={{ __html: qr }} />
            <div>
              <p className="fg-scan-title">Or scan with your phone</p>
              <p className="fg-scan-url">{host}/kit</p>
              {isLoopback(host) && (
                <p className="fg-scan-warn">Phones can’t reach {host}. Use the deployed site.</p>
              )}
            </div>
          </div>
        </article>

        <article className="fg-door">
          <p className="fg-kicker">02 · Best on a laptop</p>
          <h2 className="fg-door-title">Nurse board</h2>
          <p className="fg-door-text">
            Who has fallen behind, and every robot on a map.
          </p>
          <Link href={NURSE_PATH} className="fg-btn">
            Open the nurse board <ArrowRight aria-hidden size={18} />
          </Link>
        </article>
      </section>

      <section className="fg-wrap fg-both" aria-labelledby="both">
        <h2 id="both" className="fg-both-title">Try both at once</h2>
        <ol className="fg-steps">
          <li>Nurse board on your laptop.</li>
          <li>Patient app on your phone. Book a pickup.</li>
          <li>Watch your robot appear on the map.</li>
        </ol>
      </section>

      <section className="fg-why">
        <div className="fg-wrap">
          <p className="fg-number">12,432</p>
          <p className="fg-why-text">
            people in Helsinki never sent their screening test back in 2023.
          </p>
          <p className="fg-source">Source: Finnish Cancer Registry</p>
        </div>
      </section>

      <footer className="fg-wrap fg-foot">
        <p>
          Junction 2026 prototype. People, robots and bookings are simulated.
        </p>
        <a href="https://github.com/rromppanen/junction26">GitHub</a>
      </footer>
    </main>
  );
}
