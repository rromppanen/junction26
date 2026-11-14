const SUBSTRINGS: RegExp[] = [
  /henkilötunnus/, /personal[\s_-]*id/, /birth|syntymä/, /address|osoite/, /phone|puhelin/, /e-?mail|sähköposti/,
];
const ID_TOKENS = new Set(["hetu", "ssn", "dob", "etunimi", "sukunimi", "firstname", "lastname", "fullname"]);
const NAME_TOKENS = new Set(["name", "nimi"]);
/** Qualifiers meaning the "name" is a place/programme/etc., not a person. */
const NON_PERSON = new Set([
  "area", "region", "county", "municipality", "programme", "program", "kunta", "kunnan", "alue", "alueen",
  "hyvinvointialue", "maakunta", "ohjelma", "ohjelman", "seulonta", "group", "language", "dataset", "file", "table", "column",
]);

export function personalDataHeaders(headers: string[]): string[] {
  return headers.filter(h => {
    const k = h.normalize("NFC").trim().toLowerCase();
    if (SUBSTRINGS.some(re => re.test(k))) return true;
    const tokens = k.split(/[^a-zäöå0-9]+/).filter(Boolean);
    if (tokens.some(t => ID_TOKENS.has(t))) return true;
    return tokens.some(t => NAME_TOKENS.has(t)) && !tokens.some(t => NON_PERSON.has(t));
  });
}
