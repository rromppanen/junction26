import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { AppHeader, HeaderLink } from "@/components/ui";
import { IntakeWizard } from "@/components/intake/IntakeWizard";

export const metadata: Metadata = { title: "Analyse your data" };

export default function AnalysePage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6">
      <AppHeader>
        <HeaderLink href="/" icon={ArrowLeft} label="Map" />
      </AppHeader>
      <p className="text-sm font-medium text-muted">Analysis setup</p>
      <h1 className="mt-2 text-heading font-semibold tracking-tight sm:text-display">Choose the data for your review</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Select public datasets, set the scope and check how your columns will be used. An aggregate CSV is optional.
        You can review every setting before continuing to the county brief.
      </p>
      <div className="mt-6">
        <IntakeWizard />
      </div>
    </main>
  );
}
