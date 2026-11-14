"use client";

import { useEffect, useRef, useState } from "react";
import type { Table } from "@/lib/intake/csv";
import type { AnalysisSetup, PublicDataset } from "@/lib/intake/setup";
import { StepConfirm, SetupSummary } from "./StepConfirm";
import { StepData } from "./StepData";
import { StepQuestions, type QuestionsDone } from "./StepQuestions";

type WizardState = {
  step: 1 | 2 | 3 | 4;
  datasets: PublicDataset[];
  table: Table | null;
  fileName: string;
  error: string | null;
  result: QuestionsDone | null;
  setup: AnalysisSetup | null;
};

const INITIAL: WizardState = {
  step: 1,
  datasets: ["sotkanet-screening", "registry-pathway"],
  table: null,
  fileName: "",
  error: null,
  result: null,
  setup: null,
};

export function IntakeWizard() {
  const [state, setState] = useState<WizardState>(INITIAL);

  const stepRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(state.step);
  useEffect(() => {
    if (previousStep.current !== state.step) {
      stepRef.current?.focus();
      previousStep.current = state.step;
    }
  }, [state.step]);
  let content: React.ReactNode = null;

  if (state.step === 1) {
    content = (
      <StepData
        datasets={state.datasets}
        table={state.table}
        fileName={state.fileName}
        error={state.error}
        onDatasets={(datasets) => setState((s) => ({ ...s, datasets }))}
        onFile={(table, fileName) => setState((s) => ({ ...s, table, fileName, error: null }))}
        onError={(error) => setState((s) => ({ ...s, table: null, fileName: "", error }))}
        onContinue={() => setState((s) => ({ ...s, step: 2 }))}
      />
    );
  }

  if (state.step === 2) {
    content = (
      <StepQuestions
        datasets={state.datasets}
        table={state.table}
        onBack={() => setState((s) => ({ ...s, step: 1 }))}
        onDone={(result) => setState((s) => ({ ...s, step: 3, result }))}
      />
    );
  }

  if (state.step === 3 && state.result) {
    content = (
      <StepConfirm
        datasets={state.datasets}
        table={state.table}
        fileName={state.fileName}
        result={state.result}
        onBack={() => setState((s) => ({ ...s, step: 2 }))}
        onConfirm={(setup) => {
          try {
            sessionStorage.setItem("gapRadar.analysisSetup", JSON.stringify(setup));
          } catch {
            // storage unavailable: the summary still works
          }
          setState((s) => ({ ...s, step: 4, setup }));
        }}
      />
    );
  }

  if (state.step === 4 && state.setup) {
    const countyName =
      state.setup.countyId === null
        ? null
        : (state.result?.questions
            .find((q) => q.kind === "county")
            ?.options.find((o) => o.value === String(state.setup!.countyId))?.label ?? null);
    content = <SetupSummary setup={state.setup} countyName={countyName} onStartOver={() => {
      try {
        sessionStorage.removeItem("gapRadar.analysisSetup");
      } catch {
        // storage unavailable
      }
      setState(INITIAL);
    }} />;
  }

  const steps = ["Choose data", "Set scope", "Review settings", "Ready"];
  return (
    <div ref={stepRef} tabIndex={-1} className="rounded-[4px] focus-visible:outline-offset-4">
      <nav aria-label="Analysis setup progress" className="mb-8">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {steps.map((label, index) => (
            <li key={label} aria-current={state.step === index + 1 ? "step" : undefined}
              className={`rounded-[4px] border px-3 py-3 text-sm ${state.step === index + 1 ? "border-ink bg-ink font-semibold text-paper" : "border-rule bg-surface text-muted"}`}>
              <span className="mr-2 tabular-nums">{index + 1}.</span>{label}
              {state.step > index + 1 && <span className="sr-only"> — completed</span>}
            </li>
          ))}
        </ol>
      </nav>
      {content}
    </div>
  );
}
