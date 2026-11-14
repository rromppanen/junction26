const B = "(?:^|[^a-zäöå0-9])"; // token start
const E = "(?:$|[^a-zäöå0-9])"; // token end
const SUBSTRINGS: RegExp[] = [
  /henkil[öo]tunnus/, /personal[\s_-]*id/, /birth|syntymä/, /address|osoite/, /phone|puhelin/, /e-?mail|sähköposti/,
  /sosiaaliturvatunnus/,
  // Pseudonymous row-level identifiers: a person word, alone or glued, followed by id/numero/nro (patient_id, asiakasnumero).
  new RegExp(`${B}(?:patient|person|potilas|potilaan|asiakas|asiakkaan|henkil[öo]n?)[\\s_-]*(?:id|numero|nro)${E}`),
  new RegExp(`${B}s[\\s_-]?posti${E}`),
];
const ID_TOKENS = new Set(["hetu", "ssn", "dob", "sotu", "etunimi", "sukunimi", "firstname", "lastname", "fullname"]);
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
const PLACE_SET = new Set(PLACE_TOKENS);
const PLACE_NAME_HEADER = new RegExp(`^(?:${PLACE_TOKENS.join("|")})(?:[\\s_-]?nimi|[\\s_-]name)$`);
/** A glued compound such as henkilönimi or patientname: flagged unless the prefix is a place/organisation token (kuntanimi). */
const isPersonNameCompound = (t: string) => {
  const m = /^(.+)(?:nimi|name)$/.exec(t);
  return m !== null && !PLACE_SET.has(m[1]);
};

export function personalDataHeaders(headers: string[]): string[] {
  return headers.filter(h => {
    const k = h.normalize("NFC").trim().toLowerCase();
    if (SUBSTRINGS.some(re => re.test(k))) return true;
    const tokens = k.split(/[^a-zäöå0-9]+/).filter(Boolean);
    if (tokens.some(t => ID_TOKENS.has(t) || isPersonNameCompound(t))) return true;
    if (!tokens.some(t => NAME_TOKENS.has(t))) return false;
    return !PLACE_NAME_HEADER.test(k);
  });
}
