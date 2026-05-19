# Deep-Audit Dossier — KDP Distribution Center, Fontana CA (idx 22)

## Status: COULD NOT POSITIVELY LOCATE — confidence LOW

## Resolution attempt
- **Facility:** KDP Distribution Center — Fontana, CA (DSD depot)
- **Roster coordinates:** 34.092233, -117.435048 ("APPROXIMATE" geocode,
  reported moved 439 m).
- Probing those coordinates (z15-17) shows a **residential / small-commercial
  part of central Fontana** — a grid of city streets lined with single-family
  homes and strip retail. This is plainly not an industrial DSD depot. The
  439 m geocoder move appears to be a snap to a street centroid, not a
  resolution onto a real facility.
- Fontana's genuine warehouse / logistics district sits well to the south
  near Slover Ave / Valley Blvd; nothing resembling a KDP beverage
  distribution building is visible at or adjacent to the supplied point.

## Research conducted
Extensive web research for a verifiable KDP / Dr Pepper Snapple Fontana
distribution address, across: Indeed (company + CA locations + Fontana
reviews), Cortera, Manta, Dun & Bradstreet, Craft.co, GlobalData, KDP
careers / internal careers, ZipRecruiter, city-data business entities, and
historical bottler records. Results:
- **No verifiable street address** for a KDP / Dr Pepper Snapple
  distribution facility in Fontana was found in any source.
- Indeed lists "Fontana, CA" as one of ~27 California KDP "office locations,"
  but provides no address; such Indeed city entries are commonly derived
  from employee work-location / review data and need not map to an actual
  KDP-occupied building.
- KDP's documented Inland Empire DSD footprint surfaces as **Riverside**
  (Manta: "Keurig Dr Pepper Inc, Riverside CA 92507") and **Redlands**, not
  a confirmable standalone Fontana depot.
- A live KDP careers merchandiser/stocker posting for Fontana exists
  (job ref 91336228016) but the posting pages returned 404 and did not
  expose a worksite street address.

## Why this could not be resolved
1. The roster coordinates are non-industrial (central-Fontana residential).
2. No business directory, company page, news item, or job posting yielded a
   confirmable Fontana street address for a KDP distribution building.
3. KDP DSD depots are small and poorly documented; the roster's own source
   note ("Specific street address not located - flag for deep-audit")
   already anticipated this.

## Output
The `.json` is written with `confidence: "low"`, `perimeter` null, every
field in `uncertainFields`, and all classification flags defaulting to
false/null because no facility imagery could be assessed. Coordinates are
left at the unverified roster value.

## Recommendation
Flag for human review. Next steps: contact KDP directly for the Fontana /
Inland Empire DSD depot address; check San Bernardino County GIS /
business-license records for KDP, Dr Pepper Snapple, or American Bottling
Company parcels; pull the live KDP Fontana careers posting (ref
91336228016) for a worksite address; and verify whether the intended
facility is actually the documented Riverside or Redlands IE depot rather
than Fontana proper.

- Gate verdict: **Undetermined — facility not located**
- Guard-shack verdict: **Undetermined — facility not located**
- Confidence: **low**
