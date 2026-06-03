# Yard Audit Dossier — Walmart Fulfillment Center, McCordsville IN

**Site #05** · E-commerce / Next-Generation Fulfillment Center
**Address:** 5259 W 500 N, McCordsville IN 46055
**Resolved center:** 39.85320, -85.90640
**Method:** deep-audit (satellite z15-z20; no Street View coverage) · **Confidence: high**

---

## Location confirmation
Given coordinates (39.85349, -85.905039) landed directly on the main building
roof. Web research confirms the site: Walmart's largest fulfillment center to
date — a 2.2M sf, three-story, high-tech "next-generation" FC on a 204-acre
parcel at 5259 W 500 N, McCordsville, opened late March 2023. Walmart's own
figures: **144 docks, parking for ~2,000 cars, and spaces for 900+ trailers**.
Satellite imagery matches: one dominant white-roof FC building running E-W,
with a large car-parking lot and organized trailer drop yards on its north
side, retention ponds on the SE/SW, and active farmland buffering N/E/S.
A separate spec building sits to the south between two ponds (treated as
adjacent, not part of the Walmart operational footprint audited here).

## Key views
- **z15/z16 overview:** single large FC building, E-W, essentially axis-aligned;
  trailer/car yard to the north, ponds SE/SW, farmland buffer all around.
- **z18 north face:** regular rhythm of dock doors along the north building wall
  with trailers backed in; covered truck-court canopy; car parking beyond.
- **z18 NE yard:** large trailer drop yard — dozens of trailers in marked rows,
  plus a separate employee car-park block to its west.
- **z20 drop yard:** trailer stalls are individually numbered (B3-B23 top row,
  A-row below) — a managed, slotted drop yard (prime YardFlow target).
- **z18/z19 west:** N-S perimeter drive along the west wall; an E-W site drive
  connects out to the western public road; SW roundabout feeds the park.
- **z17 south face:** plain south wall with a perimeter road, no docks.

## Gate / guard-shack / dock determinations
- **truckGate — true (flagged uncertain):** The trailer yard is a secured,
  numbered drop yard fed through a single west-side drive throat — strong
  operational evidence of controlled access. No barrier arm crisply resolves in
  the overhead imagery, so the call rests on the secured-yard pattern rather
  than a visible gate object.
- **guardShack — false:** No manned booth (1-3-stall footprint, multi-side
  windows) was found at any approach across z17-z20. Consistent with Walmart's
  automated next-gen FC design.
- **remoteGs — true (inferred):** Gate present, no booth → kiosk / app / call-box
  check-in. Medium confidence.
- **Docks:** Primary dock bank on the NORTH building face, trailers backed in,
  covered truck-court canopy. Walmart states 144 docks → band **50+**.
- **dropArea / dropYard — 50+ / true:** Numbered NE drop yard plus a west-edge
  trailer row; Walmart states 900+ trailer spaces → band **50+**.
- **postGateStaging — true:** Wide truck court between the dock apron and the
  yard drive aisles provides interior staging.
- **fastLaneOpportunity — true:** Generous truck-court width and multiple drive
  aisles leave room for an express/bypass lane.
- **shipRcvSeparate — false:** Single consolidated dock bank on the north face.

## Yard zones & counts
- **Perimeter:** ~107-acre core developed footprint (building + north yard +
  ponds). The full parcel is ~204 acres including the undeveloped buffer and the
  south spec building, which are excluded from the operational geofence.
- **Dock apron:** one thin E-W strip hugging the north dock wall (trailer-depth),
  spanning most of the building length.
- **Drop yards:** main NE numbered drop yard + a west-edge trailer row.
- **Truck gate:** single controlled throat on the west drive.
- **dockDoorCount 144** (per Walmart) · **trailersVisible ~140** (counted across
  NE yard + west row + docks) · **trailerParkingCapacity ~900** (per Walmart) ·
  **truckGateCount 1** · **buildingCount 1** · **railServed false**.

## Web findings
- Walmart corporate (2022 site selection, 2023 opening) and trade press
  (Supply Chain Dive, IBJ, Inside INdiana Business, Commercial Property
  Executive): 2.2M sf, 3-story, 204 acres, largest Walmart FC, 144 docks,
  ~2,000 car spaces, 900+ trailer spaces, up to 1,000 employees by end-2025;
  one of four next-gen FCs (Joliet IL, Lancaster TX, Greencastle PA).
- Five-touch automated process (down from a 12-step manual flow).

## Street View
No Google Street View coverage exists near this newer (2022-2023) development —
the access and perimeter roads are too new for the SV fleet. `streetViewMeta`
for both perimeter and truckGate set to `hasCoverage: false`.

## Final confidence
**High** on site identity and overall layout (building, dock face, drop yards,
acreage all corroborated by Walmart figures + imagery). Gate-detail fields
(`truckGate`, `guardShack`, `remoteGs`, `entryLanes`, `exitLanes`,
`postGateStaging`) flagged uncertain because no barrier arm or booth resolves
crisply from overhead and there is no Street View to confirm at ground level.
