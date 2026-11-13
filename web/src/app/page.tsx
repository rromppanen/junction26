"use client";

import { useEffect, useRef, useState } from "react";
import UploadStep from "@/components/workflow/UploadStep";
import PipelineProgress, { type Progress } from "@/components/workflow/PipelineProgress";
import AttentionPanel from "@/components/workflow/AttentionPanel";
import ResultsPanel from "@/components/workflow/ResultsPanel";
import type { Mapping } from "@/lib/csv";
import type { Attention, PipelineEvent, PipelineInput, PipelineReport } from "@/lib/pipeline/types";

type View = "upload" | "processing" | "attention" | "results" | "error";
export default function Home() {
  const [view, setView] = useState<View>("upload");
  const [input, setInput] = useState<PipelineInput | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [attention, setAttention] = useState<Attention | null>(null);
  const [report, setReport] = useState<PipelineReport | null>(null);
  const [error, setError] = useState("");
  const [configuration, setConfiguration] = useState<{ geminiConfigured: boolean; contextConfigured: boolean } | null>(null);
  const active = useRef<AbortController | null>(null);
  const heading = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/pipeline", { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(value => { if (!controller.signal.aborted && value) setConfiguration(value); }).catch(() => {});
    return () => { controller.abort(); active.current?.abort(); };
  }, []);
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0 }); }, [view]);

  function restart() { active.current?.abort(); setInput(null); setReport(null); setAttention(null); setError(""); setProgress({}); setView("upload"); }
  async function run(next: PipelineInput) {
    active.current?.abort(); const controller = new AbortController(); active.current = controller;
    setInput(next); setReport(null); setAttention(null); setError(""); setProgress({}); setView("processing");
    const timeout = setTimeout(() => controller.abort("timeout"), 110000);
    let finished = false;
    function receive(event: PipelineEvent) {
      if (controller.signal.aborted) return;
      if (event.type === "progress") setProgress(current => ({ ...current, [event.stage]: { status: event.status, message: event.message } }));
      else if (event.type === "attention") { setAttention(event.attention); setView("attention"); finished = true; }
      else if (event.type === "error") { setError(event.message); setView("error"); finished = true; }
      else { setReport(event.report); setView("results"); finished = true; }
    }
    try {
      const response = await fetch("/api/pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next), signal: controller.signal });
      if (!response.ok) { const failure = await response.json().catch(() => null); throw new Error(failure?.error || "The analysis service is unavailable. Try again."); }
      const reader = response.body?.getReader(); if (!reader) throw new Error("The server returned no analysis stream.");
      const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n"); buffer = lines.pop()!;
        for (const line of lines) if (line.trim()) receive(JSON.parse(line));
        if (done) break;
      }
      if (buffer.trim()) receive(JSON.parse(buffer));
      if (!finished) throw new Error("The analysis stopped before producing a result. Try again.");
    } catch (cause) {
      if (active.current !== controller || (controller.signal.aborted && controller.signal.reason !== "timeout")) return;
      setError(controller.signal.aborted ? "The analysis timed out. Try again or use a smaller extract." : cause instanceof Error ? cause.message : "Analysis failed."); setView("error");
    } finally { clearTimeout(timeout); }
  }
  function clarify(mapping: Mapping) { if (input?.kind === "csv") void run({ ...input, mapping }); }

  return <div className="app">
    <header><span>Care Equity Lab</span><span className="muted small">Public-data prototype</span></header>
    <main><div ref={heading} tabIndex={-1} className="focus-target">
      {view === "upload" && <>
        <UploadStep onUpload={next => void run(next)}/>
        {configuration && <p className="configuration">Gemini: {configuration.geminiConfigured ? "configured" : "not configured"} · Context.dev: {configuration.contextConfigured ? "configured" : "not configured"}</p>}
        {configuration && (!configuration.geminiConfigured || !configuration.contextConfigured) && <details><summary>Enable the live integrations</summary><p>Use the same <code>GEMINI_API_KEY</code>, <code>GEMINI_MODEL</code> and <code>CONTEXT_DEV_API_KEY</code> environment settings as Gap Radar. Restart the app after configuring them. Without keys, recognised data still run automatically using the source library and labelled proposals.</p></details>}
      </>}
      {view === "processing" && <>
        <p className="eyebrow">AUTOMATIC ANALYSIS</p><h1>Working through your dataset.</h1><p className="intro">{input?.kind === "csv" ? input.name : "Finnish Cancer Registry public dataset"}</p>
        <div role="status" className="live-status">{Object.values(progress).find(activity => activity.status === "running")?.message ?? "Starting the pipeline…"}</div>
        <PipelineProgress progress={progress}/><button className="secondary" onClick={restart}>Cancel analysis</button>
      </>}
      {view === "attention" && attention && <><AttentionPanel attention={attention} onContinue={clarify} onReplace={restart}/><details><summary>Pipeline progress</summary><PipelineProgress progress={progress} paused/></details></>}
      {view === "error" && <><p className="eyebrow">ANALYSIS PAUSED</p><h1>We couldn’t complete this dataset.</h1><p className="error" role="alert">{error}</p><p className="muted">No findings or recommendations have been invented. Check the file or retry the analysis.</p><div className="step-actions"><button className="secondary" onClick={restart}>Choose another file</button><button onClick={() => input && void run(input)}>Try again</button></div><details><summary>Pipeline progress</summary><PipelineProgress progress={progress} paused/></details></>}
      {view === "results" && report && <ResultsPanel report={report} onRestart={restart}/>}
    </div></main>
  </div>;
}
