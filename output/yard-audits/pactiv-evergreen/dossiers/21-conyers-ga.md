# Pactiv Evergreen — Conyers GA (idx 21)

**Facility:** Pactiv Evergreen, 1501 Rockdale Industrial Blvd NW, Conyers, GA 30012
**Type:** Manufacturing Plant (Foodservice)
**Resolved coordinates:** 33.67700, -84.03680 (building center)
**Confidence:** High

## Location confirmation

The roster coordinate (33.676785, -84.037382, ROOFTOP, flagged 286 m off)
landed in a wooded/empty parcel. Stepping out to zoom 16 and tracing Rockdale
Industrial Blvd, the correct building resolves ~280 m south-southeast at
roughly 33.6770, -84.0368 — a large L-shaped industrial building with resin
silos, a long dock face, and a fanned trailer yard. Web search confirms Pactiv
Evergreen operates at 1501 Rockdale Industrial Blvd NW, Conyers GA 30012
(YellowPages, CMac, Conyers-Rockdale Chamber; 24-hour operation, 250-499
employees, foodservice/plastic packaging). The resin silos and thermoforming
layout are consistent with a Pactiv foodservice converting plant.

## What the imagery showed

- **Wide satellite (z16):** the building sits in the Rockdale industrial park,
  surrounded by woods and active land-grading to the east. Other warehouses
  nearby; rail line runs well to the south, not into the property.
- **Full site (z18):** L-shaped building — a white-roof section and a grey-roof
  section. Dock doors run along the south leg with ~10-12 trailers backed in.
  Employee parking is on the northeast. Resin silos cluster at the southwest.
- **Truck yard (z20):** a large paved apron south/southwest of the building
  holds 30-40 trailers parked in a fanned-out arrangement — a clear drop yard.
- **Street View (2026-02, multiple headings):** the entire compound is enclosed
  by chain-link fence. The single access road off Rockdale Industrial Blvd
  leads to a chain-link gate across the truck lane. Trailers are also parked on
  a gravel strip OUTSIDE the fence along the access road (overflow / pre-gate
  staging). No guard booth is visible anywhere — the gate is chain-link only.

## Gate / guard-shack determination

- **truckGate: TRUE.** The property is fully fenced; the access road terminates
  at a chain-link gate across the truck lane — a clear controlled entrance.
- **guardShack: FALSE.** No staffed booth (1-3-vehicle footprint) is visible at
  the fence gate or beside the building entrance in any 2026-02 Street View.
- **remoteGs: TRUE.** Gate present with no guard booth — implies kiosk /
  call-box / app-based check-in.

## Yard zones and counts

- **Perimeter:** the fenced compound — building, northeast parking, south
  trailer yard. ~17 acres.
- **Truck gate:** the chain-link gate where the access road enters the fence on
  the south.
- **Pre-gate staging:** gravel strip outside the fence holding overflow
  trailers.
- **Drop yard:** large fanned trailer-storage apron on the south/southwest;
  ~30-40 trailers without tractors → "25-50" band, `dropYard:true`.
- **Dock doors:** "10-25" band — estimated ~18 doors along the south building
  face (count approximate; flagged uncertain).
- **Rail served:** FALSE — no spur enters the property; truck-served
  thermoforming plant.

## Web findings

Pactiv Evergreen Conyers is a foodservice manufacturing plant — 24-hour
operation, 250-499 employees, $50-100M annual revenue per directory listings.
Active hiring (Packaging Associate, Maintenance roles on Indeed). The resin
silos confirm a foam/thermoforming converting operation typical of Pactiv's
foodservice segment.

## Final confidence: HIGH

Building positively re-identified despite the 286 m geocode error; corroborated
by web search and the silo/dock layout. Gate and yard reads are clear from
recent (2026-02) Street View. Dock-door count and lane counts are honest
estimates flagged as the only uncertain fields.
