const SUBSTRINGS: RegExp[] = [
  /henkil[öo]tunnus/, /personal[\s_-]*id/, /birth|syntymä/, /address|osoite/, /phone|puhelin/, /e-?mail|sähköposti/,
];
const ID_TOKENS = new Set(["hetu", "ssn", "dob", "etunimi", "sukunimi", "firstname", "lastname", "fullname"]);
const NAME_TOKENS = new Set(["name", "nimi"]);
/** Qualifier stems meaning the "name" is a place/organisation/programme, not a person (prefix match covers Finnish inflections). */
const NON_PERSON_STEMS = [
  "area", "region", "count", "municipal", "programme", "program", "group", "language", "dataset", "file", "table", "column",
  "unit", "hospital", "organi", "district",
  "kunta", "kunnan", "kuntayhtym", "seutukun", "alue", "hyvinvointialue", "maakun", "sairaanhoitopiir", "sairaala",
  "yksikk", "yksikö", "ohjelm", "seulon",
];

/**
 * A header with a person qualifier is never exempted by a place/organisation qualifier.
 * Finnish stems are cut before consonant gradation so inflected forms match:
 * asiakas/asiakkaan -> "asiak", potilas/potilaan -> "potila", asukas/asukkaan -> "asuk",
 * henkilö/henkilön/henkilo -> "henkil" (also over-flags henkilöstön nimi, staff: deliberately conservative).
 */
const PERSON_STEMS = ["patient", "potila", "asiak", "asuk", "henkil", "client", "customer", "person", "resident"];

export function personalDataHeaders(headers: string[]): string[] {
  return headers.filter(h => {
    const k = h.normalize("NFC").trim().toLowerCase();
    if (SUBSTRINGS.some(re => re.test(k))) return true;
    const tokens = k.split(/[^a-zäöå0-9]+/).filter(Boolean);
    if (tokens.some(t => ID_TOKENS.has(t))) return true;
    if (!tokens.some(t => NAME_TOKENS.has(t))) return false;
    if (tokens.some(t => PERSON_STEMS.some(s => t.startsWith(s)))) return true;
    return !tokens.some(t => NON_PERSON_STEMS.some(s => t.startsWith(s)));
  });
}
