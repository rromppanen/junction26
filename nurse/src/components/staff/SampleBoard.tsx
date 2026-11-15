"use client";

import { RobotsView } from "@/components/robots/RobotsView";

export function SampleBoard({ embed = false }: { embed?: boolean }) {
  return <RobotsView embed={embed} />;
}
