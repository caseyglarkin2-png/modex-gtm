# Deep-Audit Dossier — idx 19

## Metal Container Corporation - Riverside CA Lid Plant

**Type:** Lid Manufacturing Plant
**Account:** AB InBev (`ab-inbev`)
**Resolved address:** 7155 Central Ave, Riverside, CA 92504
**Best-estimate coords:** 33.9480, -117.4500 (airport-area industrial cluster — exact building UNCONFIRMED)

## Step 0 — Facility confirmation (UNRESOLVED)

The roster supplied only city-level coordinates (33.9533, -117.3962 — generic
Riverside center) and no street address. Web research resolved the facility to
**7155 Central Ave, Riverside, CA 92504** — consistently confirmed across Yelp,
Yahoo Local, Manta, Dun & Bradstreet, and CommercialCafe (phone
951-354-0444). CommercialCafe describes the property as a Class B industrial
building, **83,914 SF, completed 1987**, in the **"Airport neighborhood"** of
Riverside (near Riverside Municipal Airport), with roughly 200 employees per
the listing.

However, **no precise latitude/longitude could be obtained from any source** —
Waze (only a Google Place ID, no coordinates), the EPA FRS/TRI databases (no
quality-assured location for this facility), and the real-estate listings all
lacked coordinate data. I probed the industrial districts around Riverside
Municipal Airport extensively with satellite (zoom 15-17) and Street View
(2016-2024 panos):

- The airport's NE/NW edges and the SW industrial corridor are dense with
  mid-size and multi-tenant industrial buildings.
- None could be confirmed as the MCC lid plant via building signage or
  layout. The street-level signage available did not resolve "Central Ave" /
  building numbers to the 7155 address.

## What the key views showed

- The roster city coordinate landed in a residential/commercial part of
  central Riverside — clearly not the plant.
- The airport-adjacent industrial clusters (around 33.948, -117.450 and the
  diagonal arterial SW of the airport) are the most plausible area for an
  "Airport neighborhood" industrial address, but contain many candidate
  buildings of similar size, none individually confirmable as MCC.

## Determination

Per the deep-audit prompt's "If you cannot locate the facility" guidance, idx
19 is recorded with **low confidence**. All but one classification field are
listed in `uncertainFields`; the JSON carries a best-estimate coordinate in
the airport-NE industrial cluster, a nominal placeholder perimeter box, and
zeroed `yardMetrics`. `urbanRural` is set to "Urban" (the airport-area district
is unambiguously dense Riverside metro industrial fabric regardless of which
exact building is MCC).

## Web findings

MCC Riverside is one of Anheuser-Busch Metal Container Corporation's two
aluminum-lid plants (the other being Oklahoma City). Address 7155 Central Ave,
Riverside, CA 92504; ~83,914 SF building built 1987; ~200 employees. Active
facility — but its exact building footprint could not be visually confirmed.

## Final confidence

**low.** Facility address known and general area located (Riverside Municipal
Airport industrial district), but the exact building could not be positively
identified from imagery and no authoritative coordinate was obtainable.
Flagged for human review — recommend Riverside County parcel/GIS lookup of 7155
Central Ave or a direct facility contact.

### 3-line summary
- Gate verdict: UNDETERMINED — exact MCC building not identified.
- Guard-shack verdict: UNDETERMINED — exact MCC building not identified.
- Confidence: low — flagged for human review.
