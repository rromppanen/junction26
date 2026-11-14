"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SampleBoard } from "@/components/staff/SampleBoard";

function Board() {
  const embed = useSearchParams().get("embed") === "1";
  return <SampleBoard embed={embed} />;
}

export default function StaffPage() {
  return (
    <Suspense fallback={null}>
      <Board />
    </Suspense>
  );
}
