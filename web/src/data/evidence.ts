import type { EvidenceItem } from "@/lib/types";

const STRATEGY_URL =
  "https://files.hackjunction.app/resources/Kansallinen_syopastrategia_2026_2035_FINAL.pdf";
const ROADMAP_URL =
  "https://files.hackjunction.app/resources/Kansallinen_syopastrategia_toimeenpanon_tiekartta_2026_2031.pdf";

export const EVIDENCE: EvidenceItem[] = [
  {
    id: "strategy-p33-3.1",
    doc: "strategy",
    page: 33,
    titleEn: "Goal 3.1: National care guidelines and care pathways",
    summaryEn:
      "Sub-goal 3.1: national treatment recommendations and care pathways should steer equal, delay-free cancer care across Finland.",
    quoteFi:
      "Kansalliset hoitosuositukset ja hoitoketjut ohjaavat yhdenvertaista, viiveetöntä ja vaikuttavaa hoitoa",
    url: STRATEGY_URL,
  },
  {
    id: "strategy-p35-3.2",
    doc: "strategy",
    page: 35,
    titleEn: "Goal 3.2: National cancer-care quality register and systematic review of results",
    summaryEn:
      "Sub-goal 3.2: a national cancer-care quality register, systematic review of results and peer development (vertaiskehittäminen) between regions.",
    quoteFi:
      "Kansallinen syövänhoidon laaturekisteri, systemaattinen tulosten tarkastelu ja vertaiskehittäminen",
    url: STRATEGY_URL,
  },
  {
    id: "strategy-p35-regional-comparison",
    doc: "strategy",
    page: 35,
    titleEn: "Regional comparison is occasional and fragmented",
    summaryEn:
      "Comparison of care between regions is done only occasionally, using crude and fragmented measures, if at all. Finland has no national cancer-care quality register yet.",
    quoteFi:
      "Alueiden välistä vertailua hoidon toteutuksesta tehdään satunnaisesti, ja se pohjautuu karkeisiin ja hajanaisiin mittareihin",
    url: STRATEGY_URL,
  },
  {
    id: "strategy-p37-3.3",
    doc: "strategy",
    page: 37,
    titleEn: "Goal 3.3: Rehabilitation, psychosocial support and palliative care",
    summaryEn:
      "Sub-goal 3.3: rehabilitation, psychosocial support, health social work and palliative care are part of equal cancer care.",
    quoteFi:
      "Kuntoutus, psykososiaalinen tuki, terveyssosiaalityö ja palliatiivinen hoito",
    url: STRATEGY_URL,
  },
  {
    id: "strategy-p39-3.4",
    doc: "strategy",
    page: 39,
    titleEn: "Goal 3.4: Functional-capacity data guides care of older patients",
    summaryEn:
      "Sub-goal 3.4: information on functional capacity should guide diagnostics and treatment of older cancer patients.",
    quoteFi:
      "Toimintakykytieto ohjaa ikääntyneiden syöpäpotilaiden diagnostiikkaa ja hoitoa",
    url: STRATEGY_URL,
  },
  {
    id: "strategy-p41-3.5",
    doc: "strategy",
    page: 41,
    titleEn: "Goal 3.5: Sufficient and skilled workforce",
    summaryEn:
      "Sub-goal 3.5: sufficient and competent staff ensure effective, person-centred cancer care.",
    quoteFi:
      "Riittävä ja osaava henkilöstö varmistaa vaikuttavan ja ihmislähtöisen syövän hoidon",
    url: STRATEGY_URL,
  },
  {
    id: "roadmap-p52-2.5.2",
    doc: "roadmap",
    page: 52,
    titleEn: "Action 2.5.2: Standardized referral criteria from primary to specialist care",
    summaryEn:
      "Standardized referral criteria, part of national care pathways, should route patients with possible cancer symptoms quickly to diagnostic tests, using Nordic models.",
    quoteFi:
      "määrittämällä kansallisiin hoitoketjuihin kuuluvat standardoidut lähetekriteerit",
    url: ROADMAP_URL,
  },
  {
    id: "roadmap-p56-3.1.2",
    doc: "roadmap",
    page: 56,
    titleEn: "Action 3.1.2: Cancer-specific care pathways and access times",
    summaryEn:
      "General target times for access to cancer care already exist (THL guidance 21/2016). Cancer-specific pathways with their own access times are to be defined for five cancers in 2026–2028, using Nordic models (Denmark's Kræftpakkeforløb, Sweden's SVF, Norway's Pakkeforløp).",
    quoteFi:
      "Tanskan Kræftpakkeforløb; Ruotsin standardiserade vårdförlopp [SVF]; Norjan Pakkeforløp – kreft",
    url: ROADMAP_URL,
  },
  {
    id: "roadmap-p11-lymphoma",
    doc: "roadmap",
    page: 11,
    titleEn: "Diagnosis takes twice as long via public primary care",
    summaryEn:
      "An unpublished lymphoma study found time to diagnosis is twice as long when a patient with symptoms goes to public health care rather than private providers; public health centres are under-resourced.",
    quoteFi:
      "diagnoosin saamiseen kuluu yksityisen puolen toimijoihin verrattuna kaksinkertainen aika",
    url: ROADMAP_URL,
  },
  {
    id: "roadmap-p10-socioeconomic",
    doc: "roadmap",
    page: 10,
    titleEn: "Socioeconomic and language gaps in screening participation",
    summaryEn:
      "Immigrants participate less in cancer screening, and low socioeconomic status is linked to diagnostic delay and lower screening participation. A roadmap indicator targets raising screening participation of non-Finnish/Swedish speakers to the level of Finnish and Swedish speakers.",
    quoteFi:
      "äidinkielenään muita kieliä kuin suomea ja ruotsia puhuvan väestön osallistumisaste saavuttaa suomen- ja ruotsinkielisen väestön tason",
    url: ROADMAP_URL,
  },
  {
    id: "roadmap-p52-stage-target",
    doc: "roadmap",
    page: 52,
    titleEn: "Target: at least 70% of cancers found at stage I–II by 2035",
    summaryEn:
      "Early-detection target: at least 70% of cancers diagnosed at stage I–II by 2035.",
    quoteFi: "Vähintään 70 % syövistä diagnosoidaan levinneisyysluokissa I–II",
    url: ROADMAP_URL,
  },
  {
    id: "strategy-goal2-screening-80",
    doc: "strategy",
    page: 5,
    titleEn: "Goal 2 target: 80% screening participation in every county",
    summaryEn:
      "Headline indicator of Goal 2 (prevention and early detection): every cancer screening programme reaches 80% participation in every wellbeing services county.",
    quoteFi:
      "Kaikissa syöpäseulontaohjelmissa saavutetaan 80 %:n osallistumisaste jokaisella hyvinvointialueella",
    url: STRATEGY_URL,
  },
  {
    id: "strategy-goal3-headline",
    doc: "strategy",
    page: 5,
    titleEn: "Goal 3 headline indicators: survival, mortality, target times",
    summaryEn:
      "Goal 3 (equal and effective care) is measured by three headline indicators: 5-year survival in poor-prognosis cancers reaches the Nordic level (Sweden–Norway average; +14 percentage points in lung, +6 in pancreatic and +14 in liver cancer from the 2023 Nordcan level), cancer mortality falls 10% from the current 13,300 deaths a year, and patients start treatment within the target times of THL guidance 21/2016.",
    quoteFi:
      "Syöpäkuolleisuus pienenee 10 % (nykyisin 13 300 henkilöä vuodessa) • Potilaat pääsevät hoitoon tavoiteaikojen puitteissa (THL, Ohjaus 21/2016)",
    url: STRATEGY_URL,
  },
  {
    id: "roadmap-p13-distance",
    doc: "roadmap",
    page: 13,
    titleEn: "Distance to care worsens outcomes",
    summaryEn:
      "For some people the nearest central hospital is over 400 km and the nearest university hospital over 700 km away. Treatment results are weaker already when a patient lives more than 50 km from a treatment unit.",
    quoteFi:
      "hoitotulokset ovat heikompia jo silloin, jos potilas asuu yli 50 km:n päässä hoitoyksiköstä",
    url: ROADMAP_URL,
  },
];
