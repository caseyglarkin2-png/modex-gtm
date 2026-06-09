# Amazon SCK4 Inbound Cross-Dock — Stockton, CA (idx 15)

**Type:** Inbound Cross-Dock (IXD)
**Address:** 6001 S Austin Rd, Stockton, CA 95215
**Resolved center:** 37.91015, -121.18875
**Confidence:** High
**Method:** deep-audit (satellite probe.ts + Street View, March 2026 imagery)

---

## Step 0 — Location confirmation

The supplied coordinates (37.910233, -121.186541) landed on the east edge of the
correct building inside a multi-building industrial park southeast of Stockton.
Web search confirmed SCK4 is a 638,000 sq ft Amazon Inbound Cross-Dock that
opened October 2023 at 6001 S Austin Rd, operating 24/7, consolidating vendor
inbound and shipping to fulfillment centers (abc10; loc8nearme; youramazonguy).

Satellite at z16-z18 positively identified the building: a single large
white-roofed cross-dock with a faint "SCK4" roof marking, dock doors and
trailers backed in along BOTH long faces, a massive trailer drop yard on the
west side, and employee car parking to the east/north. This is unambiguously a
trailer-heavy cross-dock, consistent with an IXD. Precise center re-pinned ~340m
west of the supplied point at 37.91015, -121.18875.

## Key views

- **z16/z17 overview:** Single building, long axis ~E-W, near grid-aligned with a
  slight clockwise rotation. West = dense drop yard; east = employee parking
  toward S Austin Rd; north and south faces = dock doors + trailers.
- **z18-z19 dock faces:** Regular rhythm of dock doors with trailers backed in on
  the north and south walls — opposing-face cross-dock flow (receiving vs.
  outbound). Some colored (loaded) trailers/containers at the docks.
- **z20-z21 gate:** A controlled gate complex ~150m up the entrance drive from the
  public frontage road. A raised concrete center island carries a staffed guard
  booth (canopy, ~1-2 car footprint) splitting inbound and outbound lanes, with
  "STOP" painted on the pavement of both directions and yellow hatched safety
  striping. Multi-lane, ~2 in / ~2 out.
- **Street View (2026-03):** Frontage-road panos show the full chain-link
  perimeter fence with light poles enclosing the property, trucks/trailers staged
  on the public road shoulder before the entrance, and a deep vacant buffer
  between the public road and the fence (long approach, generous stacking room).

## Gate / guard-shack / dock determinations

- **truckGate = true.** Controlled multi-lane checkpoint with STOP markings and a
  guard island; not an open driveway. (gate at ~37.9086, -121.1888)
- **guardShack = true.** Physical staffed booth on the gate center island
  (visible at z21). Therefore **remoteGs = false**.
- **dockDoors = 50+.** Doors on both long faces; estimate ~200 total.
- **shipRcvSeparate = true.** Opposing north/south dock banks = inbound vs.
  outbound — the defining IXD pattern.
- **scale = false.** No weigh pad in the truck path. **multiStep = false** (single
  checkpoint stage observed). **railServed = false** (no spur enters the parcel).

## Yard zones & counts

- **Perimeter:** 6-vertex ring around the fenced parcel incl. the NW vacant
  expansion land; ~60 acres.
- **Drop yards (2):** large west drop yard + a north/east trailer block — hundreds
  of parked trailers (dropArea 50+, dropYard true). trailerParkingCapacity ~600,
  trailersVisible ~420 (overhead estimate, rows partly clipped at frame edges).
- **Dock aprons (2):** long thin quads hugging the north and south dock walls.
- **Staging:** large paved apron inside the gate (postGateStaging true);
  pre-gate staging present on the public frontage road and deep approach drive.
- **Gate metrics:** entryLanes ~2, exitLanes ~2; fastLaneOpportunity true (wide
  apron with spare paved width / queue stalls). drivewayLong true.

## Urban/Rural & connectivity

**Rural** — edge-of-Stockton industrial park bordered by open farmland and vacant
land to the east; per rubric tie-break toward Rural. **connectivityIssue = false**
— large active metro-adjacent Amazon campus, coverage expected fine.

## Web findings

- 638,000 sq ft IXD, opened Oct 2023, ~2,200 jobs, 24/7 operation; consolidates
  vendor inbound and ships to FCs (abc10, loc8nearme, youramazonguy, truckmap).

## Final confidence: High

Building positively identified; gate, guard booth, perimeter fence, dock pattern
and drop yards all confirmed from clear recent (2026-03) imagery. Lower-confidence
items (lane counts and exact trailer/dock tallies) are flagged in uncertainFields
and are honest overhead estimates.
