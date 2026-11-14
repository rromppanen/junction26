/** HUS organises colorectal screening for these wellbeing services counties (HUS, 2.2.2026). */
export const HUS_SCREENING_SOURCE =
  "https://www.hus.fi/en/newsroom/first-invitations-colorectal-cancer-screening-2026-will-be-mailed-february";

// Matches full Finnish names ("Itä-Uudenmaan hyvinvointialue", "Helsingin kaupunki") and short names ("Itä-Uusimaa", "Helsinki").
const HUS_AREAS = /uusimaa|uudenmaan|helsin|vantaa|kymenlaak|etelä-karjala/i;

/** Who organises colorectal screening for a county, when it is not the county itself. */
export function colorectalScreeningOperator(regionName: string): "HUS" | null {
  return HUS_AREAS.test(regionName.normalize("NFC")) ? "HUS" : null;
}
