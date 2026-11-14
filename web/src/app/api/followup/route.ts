import { draftOutreach, readReply } from "@/lib/followup/ai";
import { DEMO_PATIENTS } from "@/lib/followup/patients";

const MAX_REPLY = 600;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const b = (body ?? {}) as { action?: unknown; patientId?: unknown; text?: unknown };

  if (b.action === "draft") {
    const patient = DEMO_PATIENTS.find((p) => p.id === b.patientId);
    if (!patient) return Response.json({ error: "Unknown patient." }, { status: 400 });
    return Response.json(await draftOutreach(patient));
  }
  if (b.action === "reply") {
    if (typeof b.text !== "string" || !b.text.trim() || b.text.length > MAX_REPLY) {
      return Response.json({ error: `Reply must be 1–${MAX_REPLY} characters.` }, { status: 400 });
    }
    return Response.json(await readReply(b.text));
  }
  return Response.json({ error: "action must be draft or reply." }, { status: 400 });
}
