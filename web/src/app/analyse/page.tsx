import type { Metadata } from "next";
import { ArrowLeft, FileUp } from "lucide-react";
import { AppHeader, HeaderLink, IconHeading } from "@/components/ui";
import { IntakeWizard } from "@/components/intake/IntakeWizard";

export const metadata: Metadata = { title: "Analyse your data" };

export default function AnalysePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6">
      <AppHeader>
        <HeaderLink href="/" icon={ArrowLeft} label="Map" />
      </AppHeader>
      <IconHeading icon={FileUp} as="h2" className="text-xl">Analyse your data</IconHeading>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Choose the public datasets to include, and optionally add an aggregate file of your own.
      </p>
      <div className="mt-6">
        <IntakeWizard />
      </div>
    </main>
  );
}
