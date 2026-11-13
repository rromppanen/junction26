"""Extract the Goal 3 outcome indicator (cervical cancer 5-year relative survival) per wellbeing services county.

Usage: python3 scripts/ingest_goal3.py /path/to/values.json /path/to/regions.json
Download both deliberately first (see web/README.md). No dependencies or network calls.
"""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

INDICATOR = 3626
SOURCE_URL = f"https://sotkanet.fi/sotkanet/en/taulukko?indicator={INDICATOR}"
ROOT = Path(__file__).resolve().parents[1]
YEARS = range(2019, 2025)


def short_name(title):
    """Sotkanet "Etelä-Karjalan hyvinvointialue" → Registry "Etelä-Karjala"; names without the suffix are kept."""
    special = {"Vantaan ja Keravan hyvinvointialue": "Vantaa ja Kerava", "Lapin hyvinvointialue": "Lappi",
               "Kanta-Hämeen hyvinvointialue": "Kanta-Häme", "Päijät-Hämeen hyvinvointialue": "Päijät-Häme",
               "Satakunnan hyvinvointialue": "Satakunta", "Kainuun hyvinvointialue": "Kainuu",
               "Itä-Uudenmaan hyvinvointialue": "Itä-Uusimaa", "Keski-Uudenmaan hyvinvointialue": "Keski-Uusimaa",
               "Länsi-Uudenmaan hyvinvointialue": "Länsi-Uusimaa", "Kymenlaakson hyvinvointialue": "Kymenlaakso",
               "Pirkanmaan hyvinvointialue": "Pirkanmaa", "Pohjanmaan hyvinvointialue": "Pohjanmaa",
               "Keski-Suomen hyvinvointialue": "Keski-Suomi", "Varsinais-Suomen hyvinvointialue": "Varsinais-Suomi"}
    if title in special:
        return special[title]
    if title.endswith("n hyvinvointialue"):
        return title[: -len("n hyvinvointialue")]
    return title


def extract(values_path, regions_path):
    raw = values_path.read_bytes()
    values = json.loads(raw)
    regions = {r["id"]: r for r in json.loads(regions_path.read_bytes())}
    screening = json.loads((ROOT / "src/data/screening.json").read_text())
    expected = {r["group"] for r in screening["rows"] if r["dimension"] == "Region" and r["group"] != "All groups"}

    rows, national = [], {}
    for v in values:
        if v.get("indicator") != INDICATOR or v.get("gender") != "total" or v.get("year") not in YEARS or "value" not in v:
            continue
        region = regions.get(v["region"])
        if region is None:
            continue
        if region["category"] == "MAA":
            national[v["year"]] = v["value"]
        elif region["category"] == "HYVINVOINTIALUE":
            rows.append(dict(region=short_name(region["title"]["fi"]), sotkanetRegion=v["region"], year=v["year"], value=v["value"]))

    for year in YEARS:
        names = {r["region"] for r in rows if r["year"] == year}
        if names != expected:
            raise ValueError(f"{year}: counties do not match the screening regions: missing {sorted(expected - names)}, extra {sorted(names - expected)}")
        if year not in national:
            raise ValueError(f"{year}: national value missing")
    for r in rows:
        if not 0 <= r["value"] <= 100:
            raise ValueError(f"Out-of-range survival: {r}")

    rows.sort(key=lambda r: (r["year"], r["region"]))
    manifest = dict(publisher="THL Sotkanet (data: Finnish Cancer Registry)", indicator=INDICATOR,
                    title="Five-year relative survival of cervical cancer patients, %", sourceUrl=SOURCE_URL,
                    retrievedAt=datetime.now(timezone.utc).isoformat(), sha256=hashlib.sha256(raw).hexdigest(), adapterVersion="1.0.0",
                    note="Age-standardised to the national patient age structure. Each statistical year follows patients diagnosed in that year and the 14 preceding years, so it reflects care over a long period, not one year. Published as whole percentages without intervals.")
    out = dict(manifest=manifest, national={str(y): national[y] for y in YEARS}, rows=rows)
    (ROOT / "src/data/goal3.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print(f"Validated {len(rows)} county values for {len(expected)} counties, {min(YEARS)}–{max(YEARS)}; source SHA-256 {manifest['sha256']}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    extract(Path(sys.argv[1]), Path(sys.argv[2]))
