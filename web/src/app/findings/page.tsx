import type { Metadata } from "next";
import { GapFindings } from "@/components/findings/GapFindings";

export const metadata: Metadata = { title: "Gaps in your data" };

/** Findings for an uploaded file. The file never leaves the browser, so the page is computed client-side. */
export default function FindingsPage() {
  return <GapFindings />;
}
