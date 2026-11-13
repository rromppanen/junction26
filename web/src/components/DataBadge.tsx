import type { Dataset } from "@/lib/types";

export function DataBadge({ ds }: { ds: Pick<Dataset, "source" | "fetchedAt"> }) {
  const d = new Date(ds.fetchedAt);
  const date = Number.isNaN(d.getTime()) ? ds.fetchedAt : d.toISOString().slice(0, 10);
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-rule bg-surface px-3 py-1 text-xs text-muted">
      <span className={`h-2 w-2 rounded-full ${ds.source === "database" ? "bg-ahead" : "bg-par"}`} />
      Data: Sotkanet (THL) · {ds.source === "database" ? "live database" : "snapshot"} · fetched {date}
    </span>
  );
}
