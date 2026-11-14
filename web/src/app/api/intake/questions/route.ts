import { getQuestions } from "@/lib/intake/clarify";
import { parseIntakeInput } from "@/lib/intake/route-input";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const input = parseIntakeInput(body);
  if (typeof input === "string") return Response.json({ error: input }, { status: 400 });
  return Response.json(await getQuestions(input));
}
