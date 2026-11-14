import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTEXT_INDICATORS, INDICATORS, indicatorById } from "@/data/indicators";
import { EVIDENCE } from "@/data/evidence";
import { loadCountyBrief } from "@/lib/countyBrief";
import { diagnosePathway } from "@/lib/fingerprint";
import { describeFingerprintFi, fmtFi, whatItTakesFi } from "@/lib/memoFi";
import { PrintButton } from "@/components/PrintButton";
import type { LiveSnippet } from "@/lib/context";
import { loadPathway } from "@/lib/pathwayData";
import { MemoProposal, parseProposal } from "@/components/MemoProposal";

export const dynamic = "force-dynamic";

function sourceLabel(id: string, live: LiveSnippet[]): string {
  if (id.startsWith("live:") || id.startsWith("peer:")) {
    const s = live.find((l) => l.id === id);
    return s ? s.title : id;
  }
  if (id.startsWith("sotkanet:")) {
    const n = Number(id.slice(9));
    const ind = indicatorById(n) ?? CONTEXT_INDICATORS.find((c) => c.id === n);
    return ind ? `Sotkanet: ${ind.nameFi}` : id;
  }
  const ev = EVIDENCE.find((e) => e.id === id);
  if (!ev) return id;
  const doc = ev.doc === "strategy" ? "Kansallinen syöpästrategia" : ev.doc === "roadmap" ? "Toimeenpanon tiekartta" : "Haastekuvaus";
  return `${doc}${ev.page ? `, s. ${ev.page}` : ""}`;
}

export default async function MemoPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const proposal = parseProposal(await searchParams);
  const regionId = Number(id);
  const loaded = await loadCountyBrief(regionId, "fi");
  if (!loaded) notFound();
  const { name, facts, live, peer, brief } = loaded;

  const fp = describeFingerprintFi(diagnosePathway(facts, INDICATORS));
  const pathwayView = proposal ? loadPathway(regionId) : null;
  const citable = [...live.snippets, ...(peer?.snippets ?? [])];
  const sourceIds = [...new Set(brief.recommendations.flatMap((r) => r.sources))];
  const idx = new Map(sourceIds.map((s, i) => [s, i + 1]));
  const takes = INDICATORS.filter((i) => i.target)
    .map((ind) => {
      const f = facts.find((x) => x.indicatorId === ind.id);
      const target = ind.target?.value ?? f?.target ?? null;
      return { ind, f, target, t: whatItTakesFi(f?.value ?? null, target) };
    })
    .filter((r) => r.t !== null && r.t.full > 0);

  return (
    <main className="memo mx-auto max-w-3xl px-6 py-6">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          .memo { max-width: none; padding: 0; font-size: 9.5pt; line-height: 1.3; }
          .memo h1 { font-size: 20pt; }
          .memo h2 { font-size: 10.5pt; margin-bottom: 2pt; }
          .memo section { margin-bottom: 7pt; }
        }
      `}</style>
      <nav className="no-print mb-6 flex gap-x-6 text-sm">
        <Link href={`/county/${regionId}`} className="link">Takaisin aluesivulle</Link>
        <PrintButton>Tulosta</PrintButton>
      </nav>

      <header className="mb-4 border-b border-ink pb-3">
        <p className="text-xs uppercase tracking-wide text-muted">Hallitusmuistio · Syöpähoidon yhdenvertaisuus · {new Date().toLocaleDateString("fi-FI", { timeZone: "Europe/Helsinki" })}</p>
        <h1 className="font-narrow mt-1 text-4xl font-bold leading-none">{name}</h1>
        <p className="mt-3 font-serif text-lg leading-snug">{brief.headline}</p>
        <p className="mt-2 text-sm leading-snug">{brief.finding}</p>
        <p className="mt-2 text-sm font-semibold">{fp}</p>
      </header>

      {proposal && pathwayView && <MemoProposal view={pathwayView} params={proposal} />}

      <section aria-labelledby="m-act">
        <h2 id="m-act" className="mb-1 text-base font-semibold">Ehdotetut toimenpiteet</h2>
        <ol className="border-t border-ink">
          {brief.recommendations.map((r, i) => (
            <li key={i} className="border-b border-rule py-2 text-sm">
              <p className="leading-snug"><strong>{i + 1}.</strong> {r.action}{" "}
                <span className="text-xs text-muted">{r.sources.map((s) => `[${idx.get(s)}]`).join(" ")}</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                <strong className="text-ink">Vastuutaho:</strong> {r.owner} · <strong className="text-ink">Aikataulu:</strong> {r.timeframe} · <strong className="text-ink">Tavoite:</strong> {r.goal3Indicator}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {takes.length > 0 && (
        <section aria-labelledby="m-wit" className="mt-3">
          <h2 id="m-wit" className="mb-1 text-base font-semibold">Mitä se vaatii?</h2>
          <ul className="list-[square] space-y-0.5 pl-5 text-sm marker:text-par">
            {takes.map(({ ind, f, target, t }) => (
              <li key={ind.id}>
                {ind.nameFi} ({fmtFi(f?.value, "%")}, tavoite {target} %): tavoitteeseen noin <strong>{t!.full}</strong> lisää osallistujaa
                tuhatta kutsuttua kohden, puoliväliin noin <strong>{t!.half}</strong>.
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
        <section aria-labelledby="m-src">
          <h2 id="m-src" className="mb-1 text-base font-semibold">Lähteet</h2>
          <ol className="space-y-0.5 text-xs">
            {sourceIds.map((s, i) => (
              <li key={s} className="grid grid-cols-[1.6rem_1fr] break-words"><span className="text-muted">[{i + 1}]</span><span>{sourceLabel(s, citable)}</span></li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="m-lim">
          <h2 id="m-lim" className="mb-1 text-base font-semibold">Rajoitukset</h2>
          <ul className="list-[square] space-y-0.5 pl-4 text-xs text-muted marker:text-par">
            {brief.limitations.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </section>
      </div>
    </main>
  );
}
