import { getDataset } from "@/lib/data";
import { CONTEXT_INDICATORS, INDICATORS } from "@/data/indicators";
import { computeGap, latestYear } from "@/lib/gap";
import type { Language } from "@/lib/analyst";
import { getBrief } from "@/lib/briefCache";
import { getLiveContext, getPeerPractices, type LiveContext } from "@/lib/context";
import { findPeerTwin, worstIndicator } from "@/lib/peers";
import { equityFacts } from "@/lib/equity";
import { shortName } from "@/components/format";

/** Everything the county page and the board memo need, loaded once per request. Null when the id is not a county. */
export async function loadCountyBrief(regionId: number, language: Language = "en") {
  const ds = await getDataset();
  const region = ds.regions.find((r) => r.id === regionId && r.kind === "county"); // municipalities are not counties
  if (!region) return null;
  const nationalRegion = ds.regions.find((r) => r.isNational);
  const name = shortName(region.name);

  const facts = INDICATORS.map((ind) => computeGap(ds, ind, regionId, latestYear(ds, ind)));
  const worst = worstIndicator(facts);
  const worstInd = worst ? INDICATORS.find((i) => i.id === worst.indicatorId) : undefined;
  const twin = worst && worstInd && worst.value !== null ? findPeerTwin(ds, worstInd, regionId, worst.year) : null;
  const [live, practices]: [LiveContext, LiveContext | null] = await Promise.all([
    getLiveContext(region.name),
    twin && worstInd ? getPeerPractices(twin.twin.name, worstInd) : Promise.resolve(null),
  ]);
  const peer =
    twin && worstInd && worst && worst.value !== null && practices
      ? { twinName: shortName(twin.twin.name), indicator: worstInd, countyValue: worst.value, twinValue: twin.twinValue, snippets: practices.snippets }
      : undefined;
  const equity = equityFacts(ds, regionId, INDICATORS, CONTEXT_INDICATORS);
  const municipalityNames = ds.regions.filter((r) => r.kind === "municipality" && r.parentId === regionId).map((r) => r.name);
  const brief = await getBrief({ regionName: name, language, facts, indicators: INDICATORS, live: live.snippets, equity, peer, municipalityNames });
  return { ds, region, nationalRegion, name, facts, live, practices, peer, equity, brief };
}
