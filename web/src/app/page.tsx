import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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

/**
 * The start page is the demo's instructions: the patient app on a phone, the nurse board on a
 * computer, and one booking that shows they are linked. A computer gets the QR code; a phone is
 * told to open the patient app where it is and the board on a computer.
 */
export default async function StartPage() {
  const { url, host } = await origin();
  const kitUrl = `${url}${KIT_PATH}`;
  const qr = await QRCode.toString(kitUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1d252c", light: "#ffffff" } });

  return (
    <main id="main-content" tabIndex={-1} className="fg">
      <section className="fg-top">
        <div className="fg-photo">
          <Image src={robot} alt="" fill priority sizes="(min-width: 1000px) 50vw, 100vw" placeholder="blur" className="fg-photo-img" />
          <div className="fg-photo-shade" aria-hidden />
          <div className="fg-tag" aria-hidden>
            <p><span className="fg-led" />FG-07 · en route to lab</p>
            <p>Payload&nbsp; FIT sample ×1</p>
            <p>Pickup&nbsp;&nbsp; front door</p>
          </div>
        </div>

        <div className="fg-guide">
          <p className="fg-wordmark">
            farmagusta<span className="fg-dot" aria-hidden>.</span>
          </p>
          <h1 className="fg-title">Bowel screening, collected from the door.</h1>

          <h2 className="fg-kicker">Try the demo · about two minutes</h2>
          <ol className="fg-steps">
            <li className="fg-step">
              {/* A computer: scan with the phone. */}
              <div className="fg-wide-only">
                <h3 className="fg-step-title">Open the patient app on your phone</h3>
                <div className="fg-scan">
                  <div className="fg-qr" role="img" aria-label={`QR code that opens ${kitUrl}`} dangerouslySetInnerHTML={{ __html: qr }} />
                  <div className="fg-scan-text">
                    <p>Scan the code with the phone’s camera, or type</p>
                    <p className="fg-url">{host}/kit</p>
                    {isLoopback(host) && (
                      <p className="fg-scan-warn">Phones can’t reach {host}. Use the deployed site.</p>
                    )}
                    <Link href={KIT_PATH} className="fg-link">No phone? Open it here</Link>
                  </div>
                </div>
              </div>
              {/* A phone: it is the phone. */}
              <div className="fg-narrow-only">
                <h3 className="fg-step-title">Open the patient app on this phone</h3>
                <Link href={KIT_PATH} className="fg-btn">
                  Open the patient app <ArrowRight aria-hidden size={18} />
                </Link>
              </div>
              <p className="fg-step-text">
                <strong>Patient app:</strong> what a person invited to screening uses. Picture steps in their own language,
                then a robot collects the sample from their door.
              </p>
            </li>

            <li className="fg-step">
              <h3 className="fg-step-title">
                <span className="fg-wide-only">Open the nurse board on this computer</span>
                <span className="fg-narrow-only">Open the nurse board on a computer</span>
              </h3>
              <p className="fg-narrow-only fg-url">{host}/nurse</p>
              <a href={NURSE_PATH} target="_blank" rel="noopener" className="fg-btn">
                Open the nurse board <ArrowUpRight aria-hidden size={18} />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <p className="fg-step-text">
                <strong>Nurse board:</strong> what the screening nurse sees. Who has fallen behind, and every robot on a
                live map.
              </p>
            </li>

            <li className="fg-step">
              <h3 className="fg-step-title">Book a robot pickup on the phone</h3>
              <p className="fg-step-text">
                Go through the steps and place the pin at your door. When the phone sends the robot, watch it leave its
                hub on the nurse board’s map.
              </p>
            </li>
          </ol>
        </div>
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
          Junction 2026 prototype. People, robots and bookings are simulated. Every visitor shares one demo, so other
          people’s robots may be on the map too.
        </p>
        <a href="https://github.com/rromppanen/junction26">GitHub</a>
      </footer>
    </main>
  );
}
