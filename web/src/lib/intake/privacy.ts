const PERSONAL: RegExp[] = [
  /henkil[öo]tunnus/, /\bhetu\b/, /\bssn\b/, /personal[\s_-]*id/,
  /^(name|nimi|full[\s_-]*name|first[\s_-]*name|last[\s_-]*name|etunimi|sukunimi)$/,
  /birth[\s_-]*date|date[\s_-]*of[\s_-]*birth|\bdob\b|syntym[äa]aika/,
  /address|osoite/, /phone|puhelin/, /e-?mail|s[äa]hk[öo]posti/,
];

export function personalDataHeaders(headers: string[]): string[] {
  return headers.filter(h => { const k = h.trim().toLowerCase(); return PERSONAL.some(re => re.test(k)); });
}
