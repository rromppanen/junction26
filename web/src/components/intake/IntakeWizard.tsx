"use client";

import { useState } from "react";
import type { Table } from "@/lib/intake/csv";
import type { PublicDataset } from "@/lib/intake/setup";
import { StepData } from "./StepData";

type WizardState = {
  step: 1 | 2 | 3;
  datasets: PublicDataset[];
  table: Table | null;
  fileName: string;
  error: string | null;
};

const INITIAL: WizardState = {
  step: 1,
  datasets: ["sotkanet-screening", "registry-pathway"],
  table: null,
  fileName: "",
  error: null,
};

export function IntakeWizard() {
  const [state, setState] = useState<WizardState>(INITIAL);

  if (state.step === 1) {
    return (
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

  return (
    <section aria-labelledby="step2-h">
      <h3 id="step2-h" className="font-semibold">Next: a few questions about your data</h3>
      <button
        type="button"
        onClick={() => setState((s) => ({ ...s, step: 1 }))}
        className="mt-3 rounded-[3px] border border-rule px-3 py-1.5 text-sm hover:bg-par-soft"
      >
        Back
      </button>
    </section>
  );
}
