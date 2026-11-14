import { answersToSetup, type Answer, type Question } from "@/lib/intake/clarify";
import { parseIntakeInput } from "@/lib/intake/route-input";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { input?: unknown; questions?: unknown; answers?: unknown } | null;
  const input = parseIntakeInput(body?.input);
  if (typeof input === "string") return Response.json({ error: input }, { status: 400 });
  if (!Array.isArray(body?.questions) || !Array.isArray(body?.answers) || body.questions.length > 5 || body.answers.length > 5)
    return Response.json({ error: "questions and answers must be arrays of at most 5" }, { status: 400 });
  return Response.json(await answersToSetup(input, body.questions as Question[], body.answers as Answer[]));
}
