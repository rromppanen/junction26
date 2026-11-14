import type { Metadata } from "next";
import { GapDashboard } from "@/components/findings/GapDashboard";

export const metadata: Metadata = { title: "Gap" };

/** One gap's dashboard. The id is "step|column|group"; the file is read from this browser tab's session. */
export default async function GapPage({ params }: { params: Promise<{ gap: string }> }) {
  const { gap } = await params;
  let id = gap;
  try {
    id = decodeURIComponent(gap);
  } catch {
    // already decoded
  }
  return <GapDashboard id={id} />;
}
