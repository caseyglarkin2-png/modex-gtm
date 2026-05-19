# Deep-Audit Dossier — Tate's Bake Shop Factory, East Moriches NY (idx 6)

## Facility
- **Name:** Tate's Bake Shop Factory - East Moriches NY
- **Type:** Manufacturing - cookie bakery (Mondelez-owned, acquired 2018)
- **Address:** 62 Pine St, East Moriches, NY 11940
- **Locked coordinates:** 40.81055, -72.76535

## Step 0 — Location confirmation
Roster lat/lng (40.810409, -72.765168, ROOFTOP, moved 99 m) landed directly on
a mid-sized industrial building. Satellite probes at z17/z18/z19 confirmed a
single industrial bakery building with a small office annex on the NE corner,
an employee parking lot to the north, set back from a N-S public road (Pine
St) and bordered by woods on the west. Street View along the road shows a
"TATE'S BAKE SHOP" monument sign at the driveway corner, positively
identifying the facility. Web research (Yelp, Restaurantji, Waze) confirms 62
Pine St as the Tate's cookie factory — a high-volume thin-cookie production
plant (~7,560 cookies / 30 min). Identity and building both confirmed.

## Key views
- **z18/z19 wide:** Single bakery building (~40,000 sq ft, consistent with the
  published figure) with a small NE office annex; ~50+ stall employee parking
  lot to the north; woods on the west; quiet residential/edge-of-town setting.
- **Entrance Street View (heading 230-280):** Single driveway off Pine St,
  monument sign at the corner, heavy hedge landscaping along the frontage. A
  white trailer is visible at the building loading area. No barrier arm, no
  guard booth. A short decorative fence segment near the sign is
  pedestrian-scale only.
- **z20/z21 north face:** Loading apron on the building's north face with
  ~4 trailers / equipment units (some likely flour silos) backed against the
  wall; open paved apron in front.
- **z21 entrance / annex:** The only small structure on the property is the
  office annex with a covered canopy, located well inside the property on the
  NE corner — not a gate-side guard shack.

## Gate / guard-shack / dock determinations
- **truckGate = false.** The truck driveway is a single open curb cut off
  Pine St with no barrier arm, sliding gate, or checkpoint pinch-point. The
  only fence near the entrance is a decorative pedestrian-scale segment by the
  monument sign.
- **guardShack = false.** No staffed booth at the entrance. The NE office
  annex is a building feature, not a gate guard structure.
- **remoteGs = false.** No gate at all, so no remote check-in inferred.
- **Docks:** Loading is on the north building face. Satellite z21 shows ~4
  trailers/units backed against the wall plus a couple of additional bays —
  estimated total **0-10** dock doors. Small bakery scale.
- **Drop area:** A few untethered trailers on the north apron — band **0-10**.
  Not a dedicated drop yard.

## Yard zones and counts
- **perimeter:** ~200 m N-S x ~150 m E-W, ≈ 7.3 acres — building, north
  parking lot, and north loading apron inside the property edge.
- **truckGate box:** the single Pine St driveway entrance.
- **dockApron:** north face of the building where trailers back in.
- **dropYards / staging:** none clearly delineated.
- **yardMetrics:** dockDoorCount ~5, trailersVisible 4, capacity ~6,
  truckGateCount 1, buildingCount 2 (bakery + office annex), siteArea 7.3 ac,
  railServed false.

## Web findings
Yelp / Restaurantji / Waze confirm 62 Pine St as the active Tate's Bake Shop
production factory — a high-volume cookie line. No driver reviews indicating a
guarded gate; consistent with the open-driveway observation.

## Classification rationale
Open, ungated bakery with a single shared in/out driveway and a short
gate-to-dock approach. Driveway meets a quiet public road with minimal
stacking room, so flagged backupSensitive. Rural / edge-of-town setting. No
campus, no scale, no rail. Archetype: No Gate / No GS (#3-type).

## Confidence: HIGH
Imagery clear, facility unambiguous and web-confirmed. Low-confidence items:
exact dock-door count (loading face partly obscured by silos/trailers) and
ship/receive separation — flagged in uncertainFields.
