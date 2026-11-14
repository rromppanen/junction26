import { askKit } from "@/lib/kitAsk";
import type { Lang } from "@/lib/sample/model";

const MAX_QUESTION = 300;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const { question, lang } = (body && typeof body === "object" ? body : {}) as { question?: unknown; lang?: unknown };
  if (typeof question !== "string" || !question.trim()) {
    return Response.json({ error: "question is required." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION) {
    return Response.json({ error: `question must be at most ${MAX_QUESTION} characters.` }, { status: 400 });
  }
  const uiLang: Lang = lang === "fi" || lang === "sv" ? lang : "en";
  return Response.json(await askKit(question.trim(), undefined, uiLang));
}
