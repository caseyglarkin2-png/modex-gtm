# CJ Logistics - Lebanon TN — Deep Audit Dossier

**Idx:** 25
**Type:** Distribution Center
**Resolved coords:** 36.131, -86.4064 (14840 Central Pike / 14840 Duke Dr, Lebanon TN 37090)
**Confidence:** medium

## Location resolution
Roster supplied no street address (source: Indeed CJ Logistics America
locations list) and city-centroid coords (36.2081, -86.2911) that land in
downtown Lebanon, ~9 km from the actual building.

Web research found a documented **DSC Logistics** facility at **14840
Central Pike, Lebanon TN 37090** (also addressed 14840 Duke Dr), operating
a **B&G Foods** distribution center. DSC Logistics is the legacy company
that CJ Logistics America was formed from, so this is the CJ Logistics
Lebanon site. Geocoding API returned ROOFTOP precision at ~36.130,
-86.406; satellite confirmed a large cross-dock distribution building in
the Lebanon / Mount Juliet I-840 logistics corridor.

## Key views
- **z16/z17 overview:** Long cross-dock warehouse running NW-SE in a
  cluster of large DCs; trailers backed in along both long faces; truck
  courts wrapping the building; auto parking at the NE end.
- **z18 SE docks:** Trailers backed into dock doors along the SE face plus
  a row of parked trailers in the truck court drop area.
- **z19/z20/z21 SW corner:** A gate (cantilever / swing type) spanning the
  truck lane at the SW end of the truck court, with a small booth structure
  beside it and perimeter fencing along the court.
- **Street View 2024-12 (nearby):** Confirms the DC corridor; an O'Reilly
  Auto Parts DC sits on an adjacent parcel (different building).

## Gate / guard-shack / dock determinations
- **truckGate: true** — z20-z21 satellite clearly shows a gate spanning the
  truck lane at the SW truck court entrance, with perimeter fencing.
- **guardShack: true** — A small booth structure sits immediately beside
  the SW gate, controlling truck entry.
- **remoteGs: false** — Guard booth present.
- **dockDoors: 50+** — Long (~700 ft) cross-dock building with trailers
  backed into dock doors along both long faces; ~70 doors estimated.
  Approximate.
- **dropArea: 25-50 / dropYard: true** — ~25-30 parked trailers in the
  SE/NE truck court drop area, separate from active docks.
- **shipRcvSeparate: true** — Docks on opposing building faces.
- **drivewayLong: true** — Gate set back from the public road with a deep
  truck court wrapping the building → holds a 3+ truck queue.

## Yard zones and counts
- **perimeter:** ~35 acres — building plus wrapping truck courts.
- **truckGate:** gate + guard booth at the SW truck court entry.
- **dropYards:** trailer drop area in the SE/NE truck court.
- **dockAprons:** SW-face apron and NE/SE-face apron.
- **railServed: false** — no rail spur.

## Web findings
- 14840 Central Pike / Duke Dr documented as a DSC Logistics location
  running a B&G Foods distribution operation (Chamber of Commerce,
  Yellowpages, Waze, Manta). DSC Logistics rebranded to CJ Logistics
  America. Indeed/Glassdoor carry CJ Logistics America Lebanon reviews.

## Final confidence
**Medium.** The building is positively the documented DSC/CJ Logistics
Lebanon site and the gate + guard booth are clearly visible in high-zoom
satellite imagery. Confidence held at medium because the roster gave no
address (resolved via the DSC legacy link). Dock and trailer counts are
honest overhead estimates.
