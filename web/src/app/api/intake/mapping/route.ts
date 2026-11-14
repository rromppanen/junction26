import { answersToSetup } from "@/lib/intake/clarify";
import { parseMappingBody, readJsonBody } from "@/lib/intake/route-input";

export async function POST(req: Request) {
  const read = await readJsonBody(req);
  if ("error" in read) return Response.json({ error: read.error }, { status: 400 });
  const parsed = parseMappingBody(read.value);
  if (typeof parsed === "string") return Response.json({ error: parsed }, { status: 400 });
  return Response.json(await answersToSetup(parsed.input, parsed.questions, parsed.answers));
}
