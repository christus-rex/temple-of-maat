#!/usr/bin/env python3
import json
from pathlib import Path

path = Path('library/catalog.json')
data = json.loads(path.read_text(encoding='utf-8'))

tradition = {
  "id": "tradition.sephardic-biblical-translation",
  "type": "tradition",
  "title": "Sephardic Biblical Translation and the Ferrara Tradition",
  "summary": "A Library tradition for the Biblia de Ferrara textual lineage: Hebrew scripture carried into source-close Sephardic Spanish, with historical orthography, translation method, and edition provenance kept visible rather than modernized away.",
  "status": "reviewed",
  "provenanceLayers": ["L2"],
  "languages": ["Hebrew", "Spanish", "English"],
  "tags": ["biblia-de-ferrara", "sephardic", "spanish", "hebrew", "translation", "1553", "amsterdam-1646"]
}

source = {
  "id": "source.biblia-ferrara-amsterdam-1646-facsimile",
  "type": "source",
  "title": "Biblia de Ferrara — Amsterdam 5406/1646 Source Facsimile",
  "summary": "A digitized public-domain consultation facsimile of the Amsterdam Hebrew-year 5406/1646 edition preserving the Ferrara textual tradition associated with the first Ferrara edition of 1553. The source is kept separate and unmodified from modern gematria/discernment analysis.",
  "status": "reviewed",
  "provenanceLayers": ["L1"],
  "traditionIds": ["tradition.sephardic-biblical-translation"],
  "languages": ["Spanish", "Hebrew"],
  "tags": ["biblia-de-ferrara", "facsimile", "amsterdam-1646", "5406", "sephardic-spanish", "source-edition"],
  "sourceMetadata": {
    "sourceKind": "facsimile",
    "edition": "Amsterdam, Hebrew year 5406 / 1646",
    "dateLabel": "Ferrara textual tradition; first Ferrara edition 1553; consultation facsimile Amsterdam 5406/1646",
    "repository": "Digitized public-domain volume supplied through Google Books; preserved in the project as a source facsimile separate from the analytical study"
  },
  "rights": {
    "attribution": "Underlying historical work identified by the digitized source as public domain; this specific Google Books digitized file carries Google usage/attribution conditions.",
    "publicExposure": "metadata-only",
    "notes": "Respect the reproduced Google Books terms: personal/non-commercial use of the digitized file, no automated requests, preserve Google attribution/watermark, and verify legality in the user's jurisdiction. The Temple Library exposes metadata only and does not republish the facsimile."
  },
  "integrity": {
    "recordCount": 639,
    "integrityNote": "Complete project consultation facsimile is 639 pages. Historical title-page spelling and typography are source evidence; OCR irregularities are not silently normalized into the L1 record."
  },
  "contentLocation": "library/sources/biblia-ferrara-amsterdam-1646.index.json"
}

study = {
  "id": "study.verdad-hebrayca-ferrara-gematria",
  "type": "study",
  "title": "Verdad Hebrayca — Ferrara Gematria Discernment",
  "summary": "A modern Spanish-Hebrew computational and contemplative study of translation, creation, light, goodness, truth, exile, and ethical responsibility. Its strongest reproducible title finding is the exact 1:2:3 architecture 22/44/66 letters and 197/394/591 Spanish-ordinal totals; interpretation remains symbolic rather than evidence of historical authorial intent, prophecy, diagnosis, or supernatural rank.",
  "status": "reviewed",
  "provenanceLayers": ["L2", "L4"],
  "traditionIds": ["tradition.sephardic-biblical-translation"],
  "sourceIds": ["source.biblia-ferrara-amsterdam-1646-facsimile"],
  "languages": ["Spanish", "Hebrew", "English"],
  "tags": ["verdad-hebrayca", "gematria", "spanish-ordinal", "reverse-ordinal", "reduction", "hebrew-gematria", "translation", "discernment"],
  "normalizationProfile": {
    "name": "Ferrara Spanish 26-letter comparison profile",
    "preservesOriginal": True,
    "rules": [
      "Spanish Ordinal uses A=1 through Z=26.",
      "Remove spaces and punctuation for calculation.",
      "Normalize accented vowels to their unaccented forms.",
      "Count Spanish Ñ as N to preserve the declared 26-letter comparison system.",
      "Retain the historical spellings TRADUZIDA and HEBRAYCA before normalization.",
      "Reverse Ordinal uses A=26 through Z=1.",
      "Reduction places letter values on the 1–9 cycle; Reverse Reduction is recorded separately; digital roots summarize totals but never replace the full calculation."
    ],
    "sourcePolicy": "The Amsterdam 5406/1646 facsimile remains an L1 source object. Historical spellings are preserved when source-faithful; normalization occurs only in the analytical study."
  },
  "computationalMethod": {
    "name": "Ferrara Spanish/Hebrew dual-profile gematria",
    "method": "Spanish calculations use the separately named 26-letter Ordinal, Reverse Ordinal, Reduction, and Reverse Reduction profile. Hebrew calculations use a distinct Standard Hebrew Gematria profile for the declared Hebrew spelling. Systems are fixed before calculation and are not changed to force a desired total.",
    "implementationVersion": "verdad-hebrayca-drive-edition-2026",
    "inputFields": ["source-faithful or declared phrase", "language", "named numerical profile"],
    "reproducibilityNote": "Exact mathematical equality is distinguished from symbolic interpretation, and symbolic interpretation from historical evidence. The 1:2:3 title architecture is reproducible under the declared Spanish profile but is not evidence that the historical printers engineered it numerically."
  },
  "contentLocation": "library/studies/verdad-hebrayca-ferrara.index.json"
}

discernment = {
  "id": "discernment.ferrara-symbolic-resonance",
  "type": "discernment",
  "title": "Ferrara — Symbolic Resonance and Ethical Discernment",
  "summary": "Layer 4 metadata for the study's contemplative and personal readings. Numerical resonances are treated as questions and ethical mirrors, never as causality, historical proof, prophecy, diagnosis, destiny, or authority over another person.",
  "status": "reviewed",
  "provenanceLayers": ["L4"],
  "studyIds": ["study.verdad-hebrayca-ferrara-gematria"],
  "sourceIds": ["source.biblia-ferrara-amsterdam-1646-facsimile"],
  "tags": ["symbolic-resonance", "translation", "ethics", "exile", "responsibility", "discernment"]
}

def upsert(array_name, record):
    rows = data[array_name]
    for i, row in enumerate(rows):
        if row.get('id') == record['id']:
            rows[i] = record
            return
    rows.append(record)

upsert('traditions', tradition)
upsert('sources', source)
upsert('studies', study)
upsert('discernments', discernment)

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
