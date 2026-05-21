# UNFI — Iowa City IA DC (idx 11)

**Address:** 2340 Heinz Rd, Iowa City, IA 52240
**Resolved center:** 41.63490, -91.48630
**Confidence:** High

## Location confirmation
The roster coordinate (41.635358, -91.486512, ROOFTOP precision) landed directly
on the facility. Web search confirmed the address — "UNFI Distribution Center,
2340 Heinz Rd, Iowa City IA 52240" (Yahoo Local, hub.biz, OpenGovUS,
YellowPages). The 2003 UNFI investor-relations press release documents this as a
**legacy-UNFI** DC: UNFI acquired it with the **Blooming Prairie Cooperative**
purchase (Oct 2002) and then expanded it from ~120,000 sq ft to ~260,000 sq ft.
It serves UNFI's Central/Midwest region.

## Site layout
- **One L-shaped building**, ~260,000 sq ft (main rectangle + a section to the
  NW), white roof.
- **Dock doors** run along one continuous **south face** with trailers backed
  in.
- **Trailer drop yard** — a single row of ~20–25 trailers parked nose-out on the
  paved apron south of the building, bordered by woods and a creek.
- **Employee parking** lots on the NW and SW sides of the building; a small
  office area at the SW corner.
- The site sits inside an Iowa City industrial park (Heinz Rd / Scott-Six area)
  on the SE edge of town; other industrial buildings surround it.

## Gate / guard-shack determination
- **truckGate: false.** No barrier arm and no sliding/swing gate at any property
  edge. The truck driveway runs from the industrial-park road, around the
  building, to the south dock apron with **no checkpoint structure**. Street
  View (2024) confirms an open setting — a short chain-link fence segment near
  the west office, but no controlled truck gate. Open-campus archetype.
- **guardShack: false.** No small staffed booth (1–3-vehicle footprint, windows
  on multiple sides) found at the building, the dock-apron mouth, or the
  driveway in z18–z20 imagery. Flagged uncertain only because high-zoom coverage
  is partly tree-shadowed — but no booth-shaped structure appears.
- **remoteGs: false** — no gate, so remote check-in does not apply.

## Docks & yard
- **dockDoors: 25-50** — roughly 32 dock doors estimated along the single
  continuous south face from the rhythm of bays and backed-in trailers;
  appropriate for a ~260k sq ft DC. Exact count uncertain from overhead imagery.
- **dropArea: 10-25** — a single row of ~20–25 trailers parked nose-out south of
  the building; a modest dedicated drop yard (`dropYard: true`).
- **postGateStaging: true** — the south dock apron plus the trailer drop row
  give internal queuing room.
- **drivewayLong: true** — the internal driveway wrapping the building from the
  park road to the dock apron holds 3+ trucks.
- **shipRcvSeparate: false** — one continuous dock bank on the south face, not
  two physically separate ship/rcv banks.
- **scale: false** — no truck scale identified.
- **railServed: false** — no rail spur enters the property.
- **multipleFacilities: false** — a single L-shaped building, not a campus.

## Setting
**Rural.** The DC is in an Iowa City industrial park on the SE edge of town,
bordered by woods and a creek. Cellular coverage is adequate (industrial park,
not isolated), so `connectivityIssue: false`.

## Web findings
Legacy-UNFI Central-region DC, acquired via the Blooming Prairie Cooperative
purchase in 2002 and expanded in 2003 — one of the smaller, refrigerated-heavy
natural/organic-origin facilities described in the Bushway dossier's
"legacy-UNFI vs legacy-SuperValu" section. Indeed/Nextdoor list it as an active
distribution center.

## Final confidence: High
Location unambiguous and address-confirmed against the ROOFTOP roster
coordinate. Gate/guard-shack calls are clear (open campus, no checkpoint).
Residual uncertainty is limited to the exact dock-door count and the small
chance of a tree-shadowed booth — both flagged in `uncertainFields`.
