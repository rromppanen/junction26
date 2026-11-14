"use client";

import { useEffect, useState } from "react";
import { ROWS_KEY, SETUP_KEY, type AnalysisSetup } from "@/lib/intake/setup";

export type Analysis = { setup: AnalysisSetup & { upload: NonNullable<AnalysisSetup["upload"]> }; rows: string[][] };

/**
 * The intake's result, read from this browser tab's session storage (the file never leaves the browser).
 * null while loading, "missing" when there is nothing to show.
 */
export function useAnalysis(): Analysis | "missing" | null {
  const [state, setState] = useState<Analysis | "missing" | null>(null);
  useEffect(() => {
    try {
      const setup = JSON.parse(sessionStorage.getItem(SETUP_KEY) ?? "null") as AnalysisSetup | null;
      const rows = JSON.parse(sessionStorage.getItem(ROWS_KEY) ?? "null") as string[][] | null;
      setState(setup?.upload && Array.isArray(rows) ? ({ setup, rows } as Analysis) : "missing");
    } catch {
      setState("missing");
    }
  }, []);
  return state;
}
