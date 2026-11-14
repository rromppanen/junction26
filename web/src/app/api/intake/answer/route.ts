import { parseAnswerBody, readJsonBody } from "@/lib/intake/route-input";
import { interpretAnswer } from "@/lib/intake/understand";

export async function POST(req: Request) {
  const read = await readJsonBody(req);
  if ("error" in read) return Response.json({ error: read.error }, { status: 400 });
  const parsed = parseAnswerBody(read.value);
  if (typeof parsed === "string") return Response.json({ error: parsed }, { status: 400 });
  return Response.json(await interpretAnswer(parsed.input, parsed.question, parsed.text, parsed.guess));
}
