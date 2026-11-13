import type { Fingerprint } from "./fingerprint";
import { peoplePer1000ToReach } from "./impact";

/** Finnish number format: decimal comma, "%" with a space. */
export function fmtFi(v: number | null | undefined, unit = ""): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "–";
  const s = (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)).replace(".", ",");
  return unit ? `${s} ${unit}` : s;
}

/** Finnish counterpart of describeFingerprint. */
export function describeFingerprintFi(fp: Fingerprint): string {
  const screening = `${fp.detectionBehind}/${fp.detectionTotal} seulontaohjelmaa alle valtakunnallisen tason`;
  const survival = `${fp.outcomeBehind}/${fp.outcomeTotal} elossaolomittaria alle valtakunnallisen tason`;
  switch (fp.pattern) {
    case "detection":
      return `Havaitseminen on heikko kohta: ${screening}; ${fp.outcomeTotal === 0 ? "elossaolotietoja ei ole vertailuun" : "elossaolo on valtakunnallisella tasolla tai sen yli"}.`;
    case "after-detection":
      return `Ero ilmenee havaitsemisen jälkeen: ${survival}${fp.detectionTotal === 0 ? "; seulontatietoja ei ole vertailuun" : ", kun seulonta on valtakunnallisella tasolla tai sen yli"}.`;
    case "both":
      return `Ero ulottuu koko hoitopolulle: ${screening} ja ${survival}.`;
    case "none":
      return "Eroa ei löydy: seulonta ja elossaolo ovat valtakunnallisella tasolla tai sen yli.";
    default:
      return "Tietoja ei ole riittävästi eron sijainnin arviointiin.";
  }
}

/** People per 1,000 invited needed to reach the target in full and halfway; null without data. */
export function whatItTakesFi(value: number | null, target: number | null): { full: number; half: number } | null {
  const full = peoplePer1000ToReach(value, target);
  if (full === null || value === null || target === null) return null;
  return { full, half: peoplePer1000ToReach(value, value + (target - value) / 2) ?? 0 };
}
