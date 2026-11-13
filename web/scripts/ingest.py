"""Extract factual screening-chain counts from a downloaded official report.

Usage: python3 scripts/ingest.py /path/to/kohtu.html
No dependencies or network calls. Re-run after deliberately downloading a source.
"""
import csv
import hashlib
import json
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

URL = "https://stats.cancerregistry.fi/joukkistilastot/kohtu.html"
ROOT = Path(__file__).resolve().parents[1]
TRANSLATIONS = {
    "Kotimainen": "Finnish / Swedish / Sami", "Muu/puuttuva": "Other / missing language",
    "Perusaste/tuntematon": "Basic / unknown education", "Keskiaste": "Secondary education",
    "Korkea-aste": "Higher education", "Afrikka": "Africa", "Oseania": "Oceania",
    "Amerikka": "Americas", "Aasia": "Asia", "Muu Eurooppa": "Other Europe",
    "Suomi": "Finland", "Tuntematon": "Unknown", "Yhteensä": "All groups",
}


class Report(HTMLParser):
    def __init__(self):
        super().__init__()
        self.heading = ""
        self.text = ""
        self.context = {}
        self.rows = []
        self.row = []
        self.cell = None
        self.tables = []

    def handle_starttag(self, tag, attrs):
        if tag in ("h2", "h3", "h4"):
            self.heading, self.text = tag, ""
        if tag == "table":
            self.rows = []
        if tag == "tr":
            self.row = []
        if tag in ("td", "th"):
            self.cell = ""

    def handle_data(self, data):
        if self.heading:
            self.text += data
        if self.cell is not None:
            self.cell += data

    def handle_endtag(self, tag):
        if tag == self.heading:
            self.context[tag] = " ".join(self.text.split())
            self.heading = ""
        if tag in ("td", "th") and self.cell is not None:
            self.row.append(self.cell.strip())
            self.cell = None
        if tag == "tr":
            self.rows.append(self.row)
        if tag == "table":
            self.tables.append((dict(self.context), self.rows))


def extract(path):
    raw = path.read_bytes()
    report = Report()
    report.feed(raw.decode("utf-8"))
    result = []
    seen = set()
    for table_number, (context, rows) in enumerate(report.tables, 1):
        if not rows or len(rows[0]) != 7 or "Kutsuttu" not in rows[0]:
            continue
        section, subsection = context.get("h2"), context.get("h3")
        dimension = None
        cohort = "Routine age-based screening"
        if section == "Väestöryhmät":
            dimension = {"Äidinkieli": "Language", "Koulutus": "Education", "Syntymäalue": "Birthplace"}.get(subsection)
            cohort = "Routine + risk-group screening"
        elif section == "Koko maa" and subsection == "Seulontaketju":
            dimension = "Age"
        elif section == "Hyvinvointialueet" and subsection == "Seulontaketju":
            dimension = "Region"
        year_text = context.get("h4", "")
        if not dimension or not year_text.isdigit():
            continue
        year = int(year_text)
        # National and regional tables alternate routine and risk-group cohorts.
        key = (dimension, year)
        if key in seen:
            continue
        seen.add(key)
        for row_number, row in enumerate(rows[2:], 3):
            if len(row) != 12:
                raise ValueError(f"Changed source schema: table {table_number}, row {row_number}")
            group = row[0]
            counts = [int(row[i]) for i in (1, 2, 6, 8)]
            invited, attended, referred, completed = counts
            if not (0 <= completed <= referred <= attended <= invited):
                raise ValueError(f"Invalid counts in {dimension}/{year}/{group}")
            result.append(dict(year=year, dimension=dimension, group=TRANSLATIONS.get(group, group),
                               originalGroup=group, cohort=cohort, invited=invited, attended=attended,
                               referred=referred, completed=completed,
                               locator=f"{section} / {subsection} / {year}; table {table_number}, row {row_number}"))
    if len(seen) != 25:
        raise ValueError(f"Expected five dimensions × five years, got {len(seen)}")
    for dimension, year in seen:
        subset = [r for r in result if r["dimension"] == dimension and r["year"] == year]
        total = next(r for r in subset if r["group"] == "All groups")
        for column in ("invited", "attended", "referred", "completed"):
            if sum(r[column] for r in subset if r["group"] != "All groups") != total[column]:
                raise ValueError(f"Source rows do not reconcile: {dimension}/{year}/{column}")
    manifest = dict(publisher="Finnish Cancer Registry", title="Cervical cancer screening · 2020–2024",
                    sourceUrl=URL, reportDate="2026-05-20", retrievedAt=datetime.now(timezone.utc).isoformat(),
                    sha256=hashlib.sha256(raw).hexdigest(), adapterVersion="1.0.0",
                    note="Factual count extract. Source categories retained; unknown values are not imputed. Follow-up is recorded completion, not measured waiting time. Demographic tables pool routine and risk-group screening; age/region tables are routine screening only.")
    (ROOT / "src/data/screening.json").write_text(json.dumps(dict(manifest=manifest, rows=result), ensure_ascii=False, indent=2) + "\n")
    columns = ["year", "dimension", "group", "cohort", "invited", "attended", "referred", "completed"]
    with (ROOT / "public/data/screening.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        writer.writerows(result)
    print(f"Validated {len(result)} rows across {len(seen)} slices; source SHA-256 {manifest['sha256']}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    extract(Path(sys.argv[1]))
