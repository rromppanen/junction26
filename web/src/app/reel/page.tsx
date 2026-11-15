import type { Metadata } from "next";
import { Reel } from "@/components/reel/Reel";

export const metadata: Metadata = { title: "Demo reel" };

/** The phone app played through on its own, for screen recording the pitch video. */
export default function ReelPage() {
  return <Reel />;
}
