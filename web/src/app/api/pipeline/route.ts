import { NextResponse } from "next/server";
import { fields, Mapping } from "@/lib/csv";
import { defaultGeminiModel } from "@/lib/gemini";
import { runPipeline } from "@/lib/pipeline/run";
import { NeedsAttention, PipelineEvent, PipelineInput } from "@/lib/pipeline/types";

export const runtime = "nodejs";
export const maxDuration = 120;
let active = 0;

export async function GET() {
  return NextResponse.json({ geminiConfigured: Boolean(process.env.GEMINI_API_KEY), contextConfigured: Boolean(process.env.CONTEXT_DEV_API_KEY), model: process.env.GEMINI_MODEL || defaultGeminiModel });
}

async function readInput(request: Request): Promise<PipelineInput> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Choose a CSV file or the public demo.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 2_100_000) { await reader.cancel(); throw new Error("Upload a CSV under 1 MB."); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let at = 0;
  for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.byteLength; }
  const input = JSON.parse(new TextDecoder().decode(bytes));
  if (input?.kind === "demo") return { kind: "demo" };
  if (input?.kind !== "csv" || typeof input.name !== "string" || !input.name.trim() || input.name.length > 160 || typeof input.csv !== "string" || !input.csv.length || new TextEncoder().encode(input.csv).byteLength > 1_000_000) throw new Error("Provide a named public aggregate CSV under 1 MB.");
  if (input.mapping !== undefined && (!input.mapping || typeof input.mapping !== "object" || Array.isArray(input.mapping) || fields.some(field => typeof input.mapping[field] !== "string") || Object.keys(input.mapping).some(key => !fields.includes(key as keyof Mapping)))) throw new Error("Invalid column clarification.");
  return { kind: "csv", name: input.name, csv: input.csv, ...(input.mapping ? { mapping: input.mapping } : {}) };
}

export async function POST(request: Request) {
  if (active >= 2) return NextResponse.json({ error: "Two analyses are already running. Please try again shortly." }, { status: 429 });
  let input: PipelineInput;
  try { input = await readInput(request); }
  catch (error) { return NextResponse.json({ error: error instanceof SyntaxError ? "The upload request is not valid JSON." : error instanceof Error ? error.message : "Invalid upload." }, { status: 400 }); }
  if (active >= 2) return NextResponse.json({ error: "Analysis capacity is busy. Please try again shortly." }, { status: 429 });
  active++;
  const controller = new AbortController();
  const signal = AbortSignal.any([request.signal, controller.signal]);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(writer) {
      const emit = (event: PipelineEvent) => { if (!signal.aborted) writer.enqueue(encoder.encode(JSON.stringify(event) + "\n")); };
      void runPipeline(input, emit, signal).catch(error => {
        if (signal.aborted) return;
        emit(error instanceof NeedsAttention ? { type: "attention", attention: error.attention } : { type: "error", message: error instanceof Error ? error.message : "Analysis could not be completed." });
      }).finally(() => { active--; if (!signal.aborted) writer.close(); });
    },
    cancel() { controller.abort(); },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
