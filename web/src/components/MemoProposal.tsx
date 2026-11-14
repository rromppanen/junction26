import { accessOption, serviceOption, type BreakKind, type Costs } from "@/lib/pathway";
import type { PathwayView } from "@/lib/pathwayData";
import { COLORECTAL_SOURCE } from "@/lib/pathwayData";
import { PATHWAY_COSTS } from "@/data/pathwayCosts";
import { fmtFi } from "@/lib/memoFi";

export type ProposalParams = { option: BreakKind; target: number; costs: Costs };

const num = (s: string | string[] | undefined): number | null => {
  const v = Array.isArray(s) ? s[0] : s;
  if (v === undefined || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** The option chosen on the decision board, from the memo URL. Null when absent or malformed. */
export function parseProposal(sp: Record<string, string | string[] | undefined>): ProposalParams | null {
  const option = sp.option === "service" || sp.option === "access" ? sp.option : null;
  const target = num(sp.target);
  if (!option || target === null || target > 100) return null;
  return { option, target, costs: { perColonoscopy: num(sp.col), perContact: num(option === "service" ? sp.contact : sp.reminder), perTest: num(sp.test) } };
}

const eur = (v: number) => `${v.toLocaleString("fi-FI")} €`;

const TEXT: Record<BreakKind, { title: string; what: string; owner: string; measure: string }> = {
  service: {
    title: "Jokainen positiivinen tulos seurataan kolonoskopiaan",
    what: "Seulontahoitaja soittaa jokaiselle positiivisen tuloksen saaneelle, jolla ei ole kolonoskopia-aikaa, ja varaa ajan puhelun aikana.",
    owner: "Suolistosyövän seulonnan koordinaattori ja endoskopiayksikkö",
    measure: "Kolonoskopiassa käyneiden osuus positiivisista",
  },
  access: {
    title: "Lisää osallistujia seulontaan",
    what: "Muistutus kaikille, jotka eivät ole palauttaneet näytettä, ja kutsut alueen suurimmilla kielillä.",
    owner: "Suolistosyövän seulonnan koordinaattori ja viestintä",
    measure: "Näytteen palauttaneiden osuus kutsutuista",
  },
};

/** The board memo's proposal block: one option, baseline → target, what it takes and how it is followed up. */
export function MemoProposal({ view, params, operator = null }: { view: PathwayView; params: ProposalParams; operator?: string | null }) {
  const p = view.pathway;
  const t = TEXT[params.option];
  const r = params.option === "service" ? serviceOption(p, params.target, params.costs) : accessOption(p, params.target, params.costs);
  const today = params.option === "service" ? p.rates.examined : p.rates.participation;
  const prefilled = params.costs.perColonoscopy === PATHWAY_COSTS.perColonoscopy.value;
  return (
    <section aria-labelledby="m-prop" className="mb-3 border-b border-ink pb-3">
      <h2 id="m-prop" className="mb-1 text-base font-semibold">Esitys: {t.title}</h2>
      <p className="text-sm leading-snug">{t.what}</p>
      <table className="mt-2 w-full border-collapse text-sm">
        <tbody>
          <Row k="Mittari">{t.measure}</Row>
          <Row k="Lähtötaso">{fmtFi(today, "%")} ({p.year}, Syöpärekisteri)</Row>
          <Row k="Tavoite">{fmtFi(params.target, "%")} seuraavalla seulontakierroksella</Row>
          {params.option === "access" && <Row k="Lisää osallistujia">noin {r.extraParticipants.toLocaleString("fi-FI")} vuodessa</Row>}
          <Row k="Lisää kolonoskopioita">noin {r.extraColonoscopies.toLocaleString("fi-FI")} vuodessa</Row>
          <Row k="Löydöksiä">noin {fmtFi(r.cancers)} syöpää ja {r.advanced.toLocaleString("fi-FI")} edennyttä esiastetta vuodessa (koko maan löydösosuudella)</Row>
          <Row k="Kustannus">{r.cost === null ? "täydennetään hyvinvointialueen omilla yksikkökustannuksilla" : `noin ${eur(r.cost)} vuodessa${r.costPerFinding === null ? "" : `, ${eur(r.costPerFinding)} löydöstä kohden`}`}</Row>
          <Row k="Vastuutaho">{t.owner}{operator ? ` yhdessä seulonnan järjestäjän (${operator}) kanssa` : ""}</Row>
          <Row k="Seuranta">Kuukausittain alueen omasta aineistosta (mittauspaketti); Syöpärekisterin vuositilasto vahvistaa luvun noin puolentoista vuoden viiveellä.</Row>
        </tbody>
      </table>
      <p className="mt-1 text-xs text-muted">
        Lähde: Syöpärekisteri, suolistosyövän seulonnan vuositilasto ({COLORECTAL_SOURCE.url}).
        {prefilled && " Kolonoskopian hinta: Pohjois-Pohjanmaan hyvinvointialueen palveluhinnasto 2025 (koodi 213)."}
        {" "}Kolonoskopioiden lisäys käyttää samaa endoskopiakapasiteettia, joka määrää jonon pituuden.
      </p>
    </section>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-rule align-top">
      <th scope="row" className="w-40 py-1 pr-3 text-left font-semibold">{k}</th>
      <td className="py-1">{children}</td>
    </tr>
  );
}
