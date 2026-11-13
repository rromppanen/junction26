"use client";

import { useState } from "react";
import snapshot from "@/data/screening.json";
import UploadStep from "@/components/workflow/UploadStep";
import PrepareStep from "@/components/workflow/PrepareStep";
import AnalyseStep from "@/components/workflow/AnalyseStep";
import RecommendStep from "@/components/workflow/RecommendStep";
import type { AnalysisResult, InputDataset, PreparedDataset } from "@/components/workflow/types";

const steps = ["Upload", "Prepare", "Analyse", "Recommend"];

export default function Home() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<InputDataset | null>(null);
  const [dataset, setDataset] = useState<PreparedDataset | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  function goTo(next: number) {
    setStep(next);
    window.scrollTo({ top: 0 });
  }
  function upload(next: InputDataset) {
    setInput(next);
    setDataset(null);
    setAnalysis(null);
    goTo(1);
  }
  function prepare(next: PreparedDataset) {
    setDataset(next);
    setAnalysis(null);
    goTo(2);
  }
  function restart() {
    setInput(null);
    setDataset(null);
    setAnalysis(null);
    goTo(0);
  }

  return <div className="app">
    <header><span>Care Equity Lab</span><span className="muted small">Prototype</span></header>
    <main>
      <ol className="steps" aria-label="Workflow progress">
        {steps.map((label, index) => <li key={label} className={index === step ? "current" : index < step ? "done" : ""} aria-current={index === step ? "step" : undefined}>
          <span className="step-number">{index + 1}</span><span>{label}</span>
        </li>)}
      </ol>
      <div className="step-content" key={`${step}-${input?.sha256 ?? "empty"}`}>
        {step === 0 && <UploadStep onUpload={upload} onDemo={() => upload({ kind: "official", name: "Finnish Cancer Registry · cervical screening 2020–2024", rows: snapshot.rows, sha256: snapshot.manifest.sha256, sourceUrl: snapshot.manifest.sourceUrl })}/>}
        {step === 1 && input && <PrepareStep input={input} initialMapping={dataset?.mapping} onPrepared={prepare} onBack={() => goTo(0)}/>}
        {step === 2 && dataset && <AnalyseStep dataset={dataset} previous={analysis} onAnalysed={setAnalysis} onContinue={() => goTo(3)} onBack={() => goTo(1)}/>}
        {step === 3 && dataset && analysis && <RecommendStep dataset={dataset} analysis={analysis} onBack={() => goTo(2)} onRestart={restart}/>}
      </div>
    </main>
  </div>;
}
