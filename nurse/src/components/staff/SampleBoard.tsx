"use client";

import { RobotsView } from "@/components/robots/RobotsView";
export { DEMO_NOTE } from "./boardShared";

export function SampleBoard({ embed = false }: { embed?: boolean }) {
  return <RobotsView embed={embed} />;
}
