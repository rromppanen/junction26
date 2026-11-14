"use client";

import { useRouter } from "next/navigation";

/** "Open your county": one select that goes straight to the county's page. */
export function CountyPicker({ counties }: { counties: { id: number; name: string }[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Open your county</span>
      <select
        id="county-picker"
        defaultValue=""
        onChange={(e) => e.target.value && router.push(`/county/${e.target.value}`)}
        className="rounded-[3px] border border-rule bg-paper px-2 py-1"
      >
        <option value="" disabled>Choose…</option>
        {counties.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </label>
  );
}
