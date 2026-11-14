# Deploying Läpi

The demo link in the submission must work in an incognito window on Sunday. These steps put the app on Vercel's free tier. A team member with a Vercel account has to do them; nobody's keys go in the repo.

## 1. Create the project (about 10 minutes)

1. At <https://vercel.com/new>, import `rromppanen/junction26` from GitHub.
2. **Root Directory:** `web`. Framework: Next.js (detected).
3. **Node.js version:** 22.x (Project Settings → General).
4. Build and install commands: leave the defaults.
5. Deploy.

## 2. Environment variables (Project Settings → Environment Variables)

| Name | Needed? | Without it |
| --- | --- | --- |
| `GEMINI_API_KEY` | Recommended | The kit question box gives a fixed answer, and a judge sees no AI at work. |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-3.5-flash-lite`. For the demo, `gemini-3.8-flash` writes better text; heavier models returned 503 under load. |

Redeploy after changing variables (Deployments → ⋯ → Redeploy).

## 3. Check it

From your machine, against the deployed address:

```
cd web
npm run smoke -- https://<your-project>.vercel.app
```

It loads `/`, `/demo`, `/kit` and `/staff` and fails on any error.

Then open `/demo` in an incognito window and press "Play the story". Also ask a question in the kit's question box to check Gemini answers.

## 4. Put the link in the submission

Update the "Demo link" row in the README's submission fields and tick "Demo link works in an incognito window" in [PLAN.md](PLAN.md).

## When something goes wrong

| What you see | Likely cause | Fix |
| --- | --- | --- |
| The question box always gives the same fixed answer | Gemini key missing, wrong or rate-limited | Check `GEMINI_API_KEY`; try `gemini-3.5-flash-lite`. The rest of the demo works without it. |
| Phone and board don't update each other | Opened in two different browsers or profiles | The demo state lives in one browser; use `/demo`, or two tabs in the same window. |
