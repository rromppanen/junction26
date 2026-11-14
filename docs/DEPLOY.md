# Deploying Farmagusta

The demo runs on Vercel's free tier as two projects from this one repo: the main app (`web/`) and the nurse dashboard (`nurse/`). The main app serves the dashboard under `/nurse`, so both share one address. The repo owner sets this up once. After that, every merge to `main` deploys by itself, and every pull request gets a preview link. Nobody's keys go in the repo.

## 1. Nurse dashboard project (about 5 minutes)

1. At <https://vercel.com/new>, import `rromppanen/junction26` from GitHub.
2. **Project name:** `farmagusta-nurse`. **Root Directory:** `nurse`. Framework: Next.js (detected).
3. Deploy. Note its production address, for example `https://farmagusta-nurse.vercel.app`.

## 2. Main app project (about 5 minutes)

1. Import the same repo again.
2. **Project name:** `farmagusta`. **Root Directory:** `web`. Framework: Next.js (also set in `web/vercel.json`).
3. Under Environment Variables, add `NURSE_URL` = the nurse project's address from step 1, with no trailing slash. Without it, `/nurse` returns an error, because the main app forwards `/nurse/*` there.
4. Deploy. If the name `farmagusta` was free, the app is at `https://farmagusta.vercel.app`. Otherwise add that domain under Settings → Domains.

Optional: `GEMINI_API_KEY`, used only by `/api/kit/ask`, which the app no longer links to.

## 3. Check it

```
cd web
npm run smoke -- https://farmagusta.vercel.app
```

Then open `/kit` on a phone, allow location when you book a pickup, and watch the robot arrive. `/nurse` and `/nurse/robots` should load on the same address.

## Things that already bit us

| What you see | Cause | Fix |
| --- | --- | --- |
| Vercel refuses the build: "Vulnerable version of Next.js detected" | Next.js 15.5.4 had a known vulnerability | Both apps are on 15.5.29. Keep `next` patched. |
| `/nurse` errors on the main address | `NURSE_URL` missing or wrong | Set it to the nurse project's address and redeploy the main app. |
| The robot follows a straight line instead of streets | Both public routers in `/api/walk` (OSRM foot, then Valhalla) failed | Usually temporary. The demo still works. |
| Booking waits and then says location is off | Location was refused or the page isn't on https | Allow location for the site. The Vercel address is https. |
| The phone and the dashboard don't update each other | Demo state lives in one browser (`localStorage`) | Use two tabs in the same browser until the shared database is added. |

## Deploying from the command line instead

`npx vercel deploy --prod` in `web/` or `nurse/` also works. `.vercelignore` keeps `.env*` files and build output out of the upload. Avoid `vercel link` in `web/`, because it writes a token into `web/.env.local`.
