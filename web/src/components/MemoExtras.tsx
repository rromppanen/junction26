import type { CountyMortality } from "@/lib/mortality";
import { MORTALITY_SOURCE } from "@/lib/mortality";
import { serviceOption, type CountyPathway } from "@/lib/pathway";
import { PATHWAY_COSTS } from "@/data/pathwayCosts";

const fi1 = (v: number) => v.toLocaleString("fi-FI", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fi0 = (v: number) => v.toLocaleString("fi-FI", { maximumFractionDigits: 0 });

/**
 * Two lines for the Finnish board memo: Goal 3's headline measure (cancer mortality against Finland) and,
 * when no option was chosen on the Decide board, the costed default option (a nurse follows up every positive).
 */
export function MemoExtras({ mortality, pathway, showOption }: { mortality: CountyMortality | null; pathway: CountyPathway | null; showOption: boolean }) {
  const opt = pathway && showOption
    ? serviceOption(pathway, pathway.bestQuarter.examined, {
        perColonoscopy: PATHWAY_COSTS.perColonoscopy.value,
        perContact: PATHWAY_COSTS.perContact.value,
        perTest: null,
      })
    : null;
  if (!mortality && !(opt && opt.extraColonoscopies > 0 && opt.cost !== null)) return null;
  return (
    <section aria-labelledby="m-goal3" className="mb-4 text-sm leading-snug">
      {mortality && (
        <>
          <h2 id="m-goal3" className="mb-1 text-base font-semibold">Tavoite 3: syöpäkuolleisuus</h2>
          <p>
            Syöpäkuolleisuus {mortality.period}: naiset {fi1(mortality.women.rate)} / 100 000 (koko maa {fi1(mortality.women.national)}),
            miehet {fi1(mortality.men.rate)} / 100 000 (koko maa {fi1(mortality.men.national)}), ikävakioitu. Kansallinen syöpästrategia
            tavoittelee 10 % pienempää syöpäkuolleisuutta (s. 5). Lähde: Syöpärekisteri, <span className="break-all">{MORTALITY_SOURCE.url}</span>.
          </p>
        </>
      )}
      {opt && opt.extraColonoscopies > 0 && opt.cost !== null && pathway && (
        <>
          <h2 className="mb-1 mt-3 text-base font-semibold">Kustannusarvioitu vaihtoehto</h2>
          <p>
            Seulontahoitaja soittaa jokaiselle positiivisen suolistoseulontatuloksen saaneelle, jolla ei ole kolonoskopia-aikaa.
            Parhaan neljänneksen tasolle ({fi1(pathway.bestQuarter.examined)} % tutkituista) pääseminen tarkoittaa {fi0(opt.extraColonoscopies)}{" "}
            kolonoskopiaa lisää vuodessa, noin {fi0(opt.cost)} €
            {opt.costPerFinding !== null ? ` (${fi0(opt.costPerFinding)} € löydettyä syöpää tai edennyttä esiastetta kohti)` : ""}.
            Hinnat: Pohjois-Pohjanmaan hyvinvointialueen palveluhinnasto 2025. Laskelma, ei ennuste ({pathway.year} luvut).
          </p>
        </>
      )}
    </section>
  );
}
