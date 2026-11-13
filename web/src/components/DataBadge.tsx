import type { Dataset } from "@/lib/types";

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function DataBadge({ ds }: { ds: Pick<Dataset, "source" | "fetchedAt"> }) {
  const d = new Date(ds.fetchedAt);
  const date = Number.isNaN(d.getTime()) ? ds.fetchedAt : DATE_FMT.format(d);
  const live = ds.source === "database";
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span
        aria-hidden
        className={`inline-block h-2 w-2 rounded-full ${live ? "bg-ahead" : "border border-par bg-transparent"}`}
      />
      <span>
        {live ? "Live figures" : "Saved copy of the figures"} from THL&rsquo;s Sotkanet, fetched {date}
      </span>
    </span>
  );
}
