import type { Metadata } from "next";
import { RobotsView } from "@/components/robots/RobotsView";

export const metadata: Metadata = { title: "Robots" };

export default function RobotsPage() {
  return <RobotsView />;
}
