"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";

/** "Open your county": one select that goes straight to the county's page. */
export function CountyPicker({ counties }: { counties: { id: number; name: string }[] }) {
  const router = useRouter();
  const pickerId = useId();
  return (
    <label className="flex w-full flex-col gap-2 text-sm sm:w-auto sm:flex-row sm:items-center">
      <span className="text-muted">Open your county</span>
      <select
        id={pickerId}
        defaultValue=""
        onChange={(e) => e.target.value && router.push(`/county/${e.target.value}`)}
        className="min-h-11 min-w-48 rounded-md border border-rule bg-paper px-3 py-2"
      >
        <option value="" disabled>Choose…</option>
        {counties.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </label>
  );
}
