import type { Dataset } from "@/lib/types";

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Where the figures come from and how fresh they are.
 * A filled ink dot means they were read from the database just now; a hollow one means the app is
 * running from the copy saved in the repository. Ink, not a status colour: freshness isn't a gap.
 */
export function DataBadge({ ds }: { ds: Pick<Dataset, "source" | "fetchedAt"> }) {
  const d = new Date(ds.fetchedAt);
  const date = Number.isNaN(d.getTime()) ? ds.fetchedAt : DATE_FMT.format(d);
  const live = ds.source === "database";
  return (
    <span className="inline-flex items-baseline gap-2 text-xs text-muted">
      <span
        aria-hidden
        className={`inline-block h-[7px] w-[7px] shrink-0 -translate-y-px rounded-full ${
          live ? "bg-ink" : "border-[1.5px] border-muted bg-transparent"
        }`}
      />
      <span>
        Figures from THL&rsquo;s{" "}
        <a href="https://sotkanet.fi/sotkanet/en/" className="link no-print-url">
          Sotkanet
        </a>
        , {live ? "fetched" : "saved copy fetched"} {date}
      </span>
    </span>
  );
}
