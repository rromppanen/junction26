import { readJsonBody } from "@/lib/intake/route-input";
import { runAgent } from "@/lib/recommend";
import { parseGapBrief } from "@/lib/recommendInput";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

/** Streams the agent's steps as newline-delimited JSON, then the result. */
export async function POST(req: Request) {
  const read = await readJsonBody(req);
  if ("error" in read) return Response.json({ error: read.error }, { status: 400 });
  const brief = parseGapBrief(read.value);
  if (typeof brief === "string") return Response.json({ error: brief }, { status: 400 });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await runAgent(brief, (e) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n")));
      } catch (e) {
        console.error("[recommend] agent failed:", e);
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: "The recommendation agent failed." }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
