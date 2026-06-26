# Deep-Audit Dossier — Country Oven Bakery (idx 44)

**Facility:** Country Oven Bakery (Kroger bakery manufacturing plant)
**Type:** Bakery Plant
**Address:** 2840 Pioneer Drive, Bowling Green, KY 42101
**Resolved center:** lat 36.9485, lng -86.4905
**Method:** deep-audit · **Confidence:** medium

---

## Location confirmation
The supplied coordinates (36.9722, -86.3870) were wrong — they landed in a rural
residential/farmland pocket ~12 km NE with no industrial building. Web search
confirmed Country Oven Bakery is a Kroger-owned bakery plant at 2840 Pioneer Dr,
~450 employees, currently undergoing a $224M expansion. Geocoding pointed to the
Pioneer Drive / Kentucky Transpark industrial corridor (~36.948, -86.492). A
satellite sweep there located the true plant at **36.9485, -86.4905**: a large
multi-section manufacturing building with rooftop process equipment, a cluster of
white flour silos on the E face, an employee parking lot on the W, a rail spur,
loading-dock banks on multiple faces, and a dedicated trailer drop yard on the S/SE.
A Street View pano on Pioneer Drive (cKQtFg_0PL5uO-G5NL8fng, captured 2026-02)
looking ~133° clearly shows the plant building, silos, and trailers backed at the
docks across an open field — positive visual confirmation.

## Key views
- **z17 full site:** building oriented NW-SE, tilted ~35° off north; employee lot
  W/SW; NW dock apron with trailers; large SE concrete maneuvering apron; trailer
  drop-yard rows S; silos and rail E; active expansion construction to the NE.
- **z18/z19 docks:** long canopied dock bank along the NW face (~20 trailers backed
  in), a second canopied dock line on the N/NE near the silos, and an SE dock bank
  facing the open apron.
- **z18 drop yard:** angled/perpendicular trailer rows on the S/SE holding ~25-40
  trailers — a true dedicated drop yard separate from active dock staging.
- **z19/z20 NE:** a rail spur (parallel tracks) enters the property from the E past
  the silos — rail-served.

## Gate / guard-shack determination
**truckGate: false · guardShack: false · remoteGs: false.**
The plant sits ~150 m back from Pioneer Drive behind an open grass field and is
reached by an open private loop drive. No barrier arm, sliding/swing gate, or
checkpoint pinch-point is visible at the public-road fork or at the operational-yard
edge in z19/z20 satellite. No 1-3-vehicle guard-booth footprint is visible at any
yard entry. Street View is pinned to the public road and cannot reach the inner
yard, so a low-profile in-yard control cannot be fully excluded — hence the entry
trio is flagged in `uncertainFields` and overall confidence is **medium**. Scored as
an uncontrolled set-back campus entry.

## Yard zones & counts (estimates from overhead imagery)
- **dockDoorCount ~48** across three banks (NW apron, N/NE canopied line, SE bank).
  Band: **25-50**.
- **trailersVisible ~40**; **trailerParkingCapacity ~60**.
- **dropArea: 25-50** (S/SE trailer rows). **dropYard: true.**
- **truckGateCount 1**, **buildingCount 1** (multi-section), **railServed true**.
- **siteAreaAcres ~38** (fenced operational footprint from the perimeter ring;
  excludes the wooded NE buffer and the active expansion parcel).
- **postGateStaging true** — the large SE paved apron is an internal holding area
  ahead of the SE dock bank.
- **shipRcvSeparate true** (medium) — physically separate NW vs SE dock clusters.
- **fastLaneOpportunity true** — wide internal drives and the deep SE apron offer
  paved room for a bypass/express lane.
- **drivewayLong true** — the inner approach easily holds a 3+ truck queue.
- **urbanRural Rural** — edge-of-town Transpark corridor fronted by farmland and a
  divided highway.

## Web findings
- Kroger-owned (The Kroger Co. corporate bakery); produces cakes, breads, rolls,
  cookies and pastries for Kroger banners. Opened 1981.
- ~450 employees; M-F operation; $224,000,000 expansion announced for the Pioneer
  Drive facility (consistent with the active construction NE of the plant).

## Final confidence
**Medium.** Location is positively confirmed and the docks, drop yard, rail, and
silos are unambiguous. The gate/guard-shack call rests on satellite plus public-road
Street View only (no in-yard pano), so the entry-control fields are flagged
uncertain.
