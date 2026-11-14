# Deploying Läpi

The demo link in the submission must work in an incognito window on Sunday. These steps put the app on Vercel's free tier. A team member with a Vercel account has to do them; nobody's keys go in the repo.

## 1. Create the project (about 10 minutes)

1. At <https://vercel.com/new>, import `rromppanen/junction26` from GitHub.
2. **Root Directory:** `web`. Framework: Next.js (detected).
3. **Node.js version:** 22.x (Project Settings → General).
4. Build and install commands: leave the defaults. `npm run build` runs `prebuild`, which fetches the Sotkanet snapshot from THL's open API on every deploy.
5. Deploy. The first build takes 2–3 minutes.

## 2. Environment variables (Project Settings → Environment Variables)

| Name | Needed? | Without it |
| --- | --- | --- |
| `GEMINI_API_KEY` | Recommended | Briefs and translated invitations come from the fixed templates, and a judge sees no AI at work. |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-3.5-flash-lite`. For the demo, `gemini-3.8-flash` writes better text; heavier models returned 503 under load. |
| `CONTEXT_DEV_API_KEY` | Optional | "Web pages found today" and the peer county's pages are empty. The current key is invalid (401); get a new secret key at <https://context.dev/dashboard>. |
| `DATABASE_URL` | Optional | The app reads the snapshot built at deploy time. With Aiven Postgres, run `npm run data -- --force` locally with the same variable set to fill the table. |

Redeploy after changing variables (Deployments → ⋯ → Redeploy).

## 3. Check it

From your machine, against the deployed address:

```
cd web
npm run smoke -- https://<your-project>.vercel.app
```

It loads the start page, the simulator and every county's page, memo and CSV, and fails on any error. It also warms the pages, so run it again **within 10 minutes of the live demo**: the first load of a county brief waits for Gemini.

Then open the link in an incognito window and click through: start page → county picker → Helsinki → Decide → Memo (FI) → Simulate.

## 4. Put the link in the submission

Update the "Demo link" row in the README's submission fields and tick "Demo link works in an incognito window" in [PLAN.md](PLAN.md).

## When something goes wrong

| What you see | Likely cause | Fix |
| --- | --- | --- |
| Build fails at "Fetching the data snapshot" | Sotkanet API slow or down | Redeploy; the script retries 4 times. If it keeps failing, commit a snapshot temporarily (`git add -f web/src/data/snapshot.json`). |
| County brief says "The AI analyst didn't respond" | Gemini key missing, wrong or rate-limited | Check `GEMINI_API_KEY`; try `gemini-3.5-flash-lite`. The page still works with the template text. |
| "The web search didn't answer just now" | Context.dev key invalid | Optional; set a new key or leave it. |
| A county page is slow the first time | Gemini writes the brief on first view | Run the smoke test to warm the pages. |
