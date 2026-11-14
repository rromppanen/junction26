import { parseIntakeInput, readJsonBody } from "@/lib/intake/route-input";
import { understandData } from "@/lib/intake/understand";

export async function POST(req: Request) {
  const read = await readJsonBody(req);
  if ("error" in read) return Response.json({ error: read.error }, { status: 400 });
  const input = parseIntakeInput(read.value);
  if (typeof input === "string") return Response.json({ error: input }, { status: 400 });
  return Response.json(await understandData(input));
}
