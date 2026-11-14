const SUBSTRINGS: RegExp[] = [
  /henkil[öo]tunnus/, /personal[\s_-]*id/, /birth|syntymä/, /address|osoite/, /phone|puhelin/, /e-?mail|sähköposti/,
];
const ID_TOKENS = new Set(["hetu", "ssn", "dob", "etunimi", "sukunimi", "firstname", "lastname", "fullname"]);
const NAME_TOKENS = new Set(["name", "nimi"]);
/**
 * Closed list of place/organisation words (incl. Finnish genitives). A name header is exempt only when it is
 * exactly one of these followed by the name token (fail closed: anything else with a name token is flagged).
 */
const PLACE_TOKENS = [
  "kunta", "kunnan", "alue", "alueen", "hyvinvointialue", "hyvinvointialueen", "maakunta", "maakunnan",
  "sairaanhoitopiiri", "sairaanhoitopiirin", "kuntayhtymä", "kuntayhtymän", "seutukunta", "seutukunnan",
  "sairaala", "sairaalan", "yksikkö", "yksikön", "ohjelma", "ohjelman", "kieli", "kielen",
  "area", "region", "county", "municipality", "district", "hospital", "unit", "programme", "program", "group", "language",
];
const PLACE_NAME_HEADER = new RegExp(`^(?:${PLACE_TOKENS.join("|")})(?:[\\s_-]?nimi|[\\s_-]name)$`);

export function personalDataHeaders(headers: string[]): string[] {
  return headers.filter(h => {
    const k = h.normalize("NFC").trim().toLowerCase();
    if (SUBSTRINGS.some(re => re.test(k))) return true;
    const tokens = k.split(/[^a-zäöå0-9]+/).filter(Boolean);
    if (tokens.some(t => ID_TOKENS.has(t))) return true;
    if (!tokens.some(t => NAME_TOKENS.has(t))) return false;
    return !PLACE_NAME_HEADER.test(k);
  });
}
