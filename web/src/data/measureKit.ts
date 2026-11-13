export type Measure = { id: string; nameFi: string; nameEn: string; definition: string; evidenceId: string };

const EV = "strategy-goal3-headline";

/** The three delays no public source reports per county; targets are in THL guidance 21/2016. */
export const MEASURES: Measure[] = [
  {
    id: "referral-to-specialist",
    nameFi: "Lähetteestä erikoislääkärin vastaanotolle",
    nameEn: "Referral to specialist visit",
    definition: "Days from the date a referral is received to the first specialist visit. Report the monthly median.",
    evidenceId: EV,
  },
  {
    id: "suspicion-to-diagnosis",
    nameFi: "Syöpäepäilystä diagnoosiin",
    nameEn: "Suspicion to diagnosis",
    definition: "Days from the first documented cancer suspicion to the confirmed diagnosis. Report the monthly median.",
    evidenceId: EV,
  },
  {
    id: "diagnosis-to-treatment",
    nameFi: "Diagnoosista hoidon aloitukseen",
    nameEn: "Diagnosis to treatment start",
    definition: "Days from the confirmed diagnosis to the start of treatment. Report the monthly median.",
    evidenceId: EV,
  },
];

export const MEASURE_CSV_HEADER = "kuukausi,syopa,mittari,mediaani_vrk,potilaita";

/** Header plus one empty example row (month, cancer type, measure id, median days, patients). */
export function measureCsv(): string {
  return `${MEASURE_CSV_HEADER}\n2026-01,,${MEASURES[0].id},,\n`;
}
