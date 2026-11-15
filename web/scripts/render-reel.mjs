/*
  Renders the demo reel (/reel) into a video, frame by frame, so it is perfectly smooth on any machine.

  The page runs on a virtual clock: for every frame the clock moves exactly 1/fps of a second, CSS
  animations are set to that moment, the maps wait for their tiles, and only then is the frame captured.
  However slow the computer, no frame is dropped.

  Needs two packages that are not part of the app (installed without touching package.json):
    npm i --no-save playwright ffmpeg-static && npx playwright install chromium
  Then, with the app running (npm run build && npm start, or npm run dev):
    node scripts/render-reel.mjs [--url http://localhost:3000] [--out reel.mp4] [--fps 60] [--width 1920] [--height 1080]
*/
import { spawn } from "node:child_process";

const opts = { url: "http://localhost:3000", out: "reel.mp4", fps: 60, width: 1920, height: 1080, chrome: "" };
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i].replace(/^--/, "");
  if (!(key in opts)) throw new Error(`unknown option --${key}`);
  opts[key] = typeof opts[key] === "number" ? Number(process.argv[i + 1]) : process.argv[i + 1];
}

let chromium, ffmpegPath;
try {
  ({ chromium } = await import("playwright"));
  ffmpegPath = (await import("ffmpeg-static")).default;
} catch {
  console.error("Install the render tools first: npm i --no-save playwright ffmpeg-static && npx playwright install chromium");
  process.exit(1);
}

const frameMs = 1000 / opts.fps;
const TAIL_MS = 2500; // keep filming the last screen this long after the reel ends
const LEAD_MS = 1000; // and the first screen this long before it starts
const MAX_MS = 150_000;

const browser = await chromium.launch({
  ...(opts.chrome ? { executablePath: opts.chrome } : {}),
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("page error:", e.message));

// The phone shows 12:41, so the booking screen offers times today.
const start = new Date();
start.setHours(12, 41, 0, 0);
await page.clock.install({ time: start });

console.log("loading the reel and warming up the map tiles…");
await page.goto(`${opts.url.replace(/\/$/, "")}/reel?render=1`, { waitUntil: "networkidle" });
await page.addStyleTag({ content: ".reel-hint { display: none !important; }" });
// The full-screen map registers itself once it has visited (and cached) every view the reel flies through.
await page.waitForFunction(() => (window.__reelMaps?.length ?? 0) >= 1 && window.__reelMaps.every((m) => m.loaded()), null, {
  timeout: 180_000,
  polling: 500,
});
await page.waitForTimeout(1500);

// From here time only moves when a frame is made.
const fakeNow = await page.evaluate(() => Date.now());
await page.clock.pauseAt(fakeNow + 200);
await page.evaluate(() => {
  const seen = new WeakMap();
  /** Every CSS animation and transition is paused and set to the virtual time since it began. */
  window.__syncAnimations = () => {
    const now = performance.now();
    for (const a of document.getAnimations()) {
      let t0 = seen.get(a);
      if (t0 === undefined) {
        t0 = now - Math.min(Number(a.currentTime ?? 0), 50);
        seen.set(a, t0);
        a.pause();
      }
      a.currentTime = now - t0;
    }
  };
  window.__flush = () =>
    new Promise((resolve) => {
      // React commits on a message-channel task, which the virtual clock does not hold back.
      const c = new MessageChannel();
      c.port1.onmessage = () => {
        const d = new MessageChannel();
        d.port1.onmessage = () => resolve();
        d.port2.postMessage(0);
      };
      c.port2.postMessage(0);
    });
});

const ffmpeg = spawn(ffmpegPath, [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(opts.fps), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  opts.out,
], { stdio: ["pipe", "inherit", "inherit"] });
const ffmpegDone = new Promise((resolve, reject) => ffmpeg.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))));

const cdp = await page.context().newCDPSession(page);
async function frame() {
  await page.clock.runFor(frameMs);
  await page.evaluate(() => window.__flush());
  await page.evaluate(() => window.__syncAnimations());
  // Wait (in real time) for map tiles in view, then draw the maps again with them.
  let waited = false;
  for (let i = 0; i < 200; i++) {
    const pending = await page.evaluate(() =>
      (window.__reelMaps ?? []).some((m) => {
        try {
          return !m.areTilesLoaded();
        } catch {
          return false; // a map the page has removed
        }
      }),
    );
    if (!pending) break;
    waited = true;
    await new Promise((r) => setTimeout(r, 25));
  }
  if (waited) {
    await page.evaluate(() =>
      (window.__reelMaps ?? []).forEach((m) => {
        try {
          m.redraw();
        } catch {
          /* removed */
        }
      }),
    );
  }
  const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 94 });
  if (!ffmpeg.stdin.write(Buffer.from(data, "base64"))) await new Promise((r) => ffmpeg.stdin.once("drain", r));
}

let n = 0;
const t0 = Date.now();
const report = () => console.log(`${(n / opts.fps).toFixed(1)} s of video (${n} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s so far)`);
for (let ms = 0; ms < LEAD_MS; ms += frameMs, n++) await frame();
await page.keyboard.press("Space");
let endAt = Infinity;
for (let ms = 0; ms < Math.min(endAt, MAX_MS); ms += frameMs, n++) {
  await frame();
  if (endAt === Infinity && (await page.evaluate(() => document.documentElement.dataset.reelDone === "1"))) endAt = ms + TAIL_MS;
  if (n % (opts.fps * 5) === 0) report();
}
report();
ffmpeg.stdin.end();
await ffmpegDone;
await browser.close();
console.log(`done: ${opts.out}`);
