# Deep-Audit Dossier — Papillion Foods, Papillion NE (idx 13)

**Account:** Hormel Foods
**Facility type:** Production Facility (dry sausage / salami — Columbus Craft Meats & Hormel brands)
**Resolved coordinates:** 41.15200, -96.12400
**Confidence:** Medium

## Location confirmation
The roster geocoded "11840 Standing Stone Dr, Papillion NE" to 41.15444,
-96.043031 — a major intersection in downtown Papillion with only small
commercial buildings. That is wrong.

Web research established that Papillion Foods is the **former Shopko
distribution center at 10808 S 132nd St, Papillion NE 68138**: a 535,000 sq ft
building on an ~80-acre site, originally built by Shopko in 2000 with a 2004
addition, vacated 2019, acquired and significantly renovated by Hormel's
Papillion Foods LLC, and opened in December 2020 to produce dry sausage and
salami. (Note: a separate large building further north on S 132nd St at 8401 is
CLAAS Omaha, the German farm-machinery maker — not Hormel; that was excluded.)

The converted DC was resolved to a large warehouse at ~41.1518, -96.1245 in the
Sarpy West industrial submarket. The match: an ~86-acre parcel (consistent with
the reported 80 acres), a roof addition seam consistent with the 2000/2004
build history, large ammonia-refrigeration condenser banks plus rooftop solar,
a long south-facing dock bank with trailers, employee parking on the north, and
a formal flagpole-circle main entrance. Confidence is held to **Medium** because
the corridor contains several large warehouses and recent on-site Street View
was unavailable to read current signage.

## Key views
- **Satellite z17-z19:** Large rectangular plant building with a two-phase roof,
  refrigeration condenser arrays, west-section solar; dock bank along the south
  face with trailers backed in; broad paved truck yard; office structure on the
  east side; flagpole circle entrance to the north.
- **Street View (2007-2010, Shopko era):** Trailers backed into the south dock
  and parked across an open paved yard — no perimeter fence/gate in view.
- **Surroundings:** Sarpy West industrial submarket — other large warehouses,
  arterial roads, suburban Omaha metro fabric.

## Gate / guard-shack determination
- **truckGate: false** (uncertain). No barrier arm, sliding gate, or checkpoint
  pinch-point visible in satellite imagery; the truck access road runs openly
  from the public road into the dock yard. Flagged uncertain — only dated
  (2007-2010) interior Street View was available.
- **guardShack: false** (uncertain). The small structure near the access road is
  a utility/storage building set in a landscaped island, not a booth astride the
  truck lane. No staffed guard booth identified.
- **remoteGs: false** (no confirmed gate).

## Yard zones and counts
- **Perimeter:** ~86 acres — matches the reported 80-acre property. Boxed.
- **Dock apron:** long south-face dock bank, boxed.
- **Drop yard:** paved south/east truck yard holds parked trailers — `dropYard:
  true`; boxed.
- **dockDoorCount ~40 (25-50), trailersVisible ~25, capacity ~80** — honest
  overhead estimates.
- **drivewayLong / postGateStaging:** deep paved approach and a large in-yard
  holding area easily stack 3+ trucks.
- **fastLaneOpportunity: true** — very wide open paved yard.
- **truckGateCount 1, buildingCount 2, railServed false.**

## Web findings
Papillion Foods LLC (Hormel) — 10808 S 132nd St, Papillion NE 68138. A
535,000 sq ft former Shopko DC, ~$60M renovation, opened December 2020;
produces Columbus salami and Hormel dry sausage; AGV-equipped, LED motion
lighting, modern sustainability features; ~170-350 team members.

## Final assessment
Large converted distribution-center food plant with an open, ungated truck yard,
a long south dock bank and ample paved trailer parking. No truck gate or guard
shack identified, though that determination relies on satellite imagery plus
dated Street View and is flagged uncertain. Overall confidence: **Medium** — the
plant building was resolved by address, footprint, acreage and refrigeration
markers, but the roster's supplied geocode was wrong and current ground-level
imagery was unavailable.
