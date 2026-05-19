# Deep-Audit Dossier — idx 18

## K-C DuPont Distribution Center (KCDC) — DuPont, WA

**Roster coords:** 47.114289, -122.631979 (ROOFTOP, moved 1879 m)
**Locked center:** 47.11280, -122.63800
**Type:** Distribution center
**Gate verdict:** Truck gate YES — guard booth mid-lane with split entry/exit
**Guard-shack verdict:** YES — booth standing in the truck driveway
**Archetype:** Gate + Guard Shack DC with fast-lane room (cross-dock)
**Confidence:** HIGH

---

## Step 0 — Location confirmation

The roster ROOFTOP coordinates (moved 1879 m) landed near the center of a
warehouse cluster — "The Cubes at DuPont," a 1.6M sq ft, 3-building Class-A
business park on the former Intel campus / DuPont Corporate Center in the
Northwest Landing community of DuPont WA.

Web research pinned the specific building: per CRG and The Registry, **Building
1** of The Cubes is **747,488 sq ft and 100% leased to Kimberly-Clark** — the
KCDC at **1205 Wharf Rd**. Building 2 (494,900 sq ft) and Building 3 (340,000
sq ft, renovated former Intel building) are separate. Building 1 is the
largest building in the park — the big N-S cross-dock structure — and was
located on satellite at ~47.1128, −122.6380. Coordinates locked there.

## Steps 1–3 — Imagery review

- **Wide satellite:** The Cubes at DuPont — three large distribution buildings
  in a forested industrial park on the edge of small-town DuPont, just off I-5.
- **Overview / tight satellite:** Building 1 is a long rectangular DC oriented
  N–S, cross-dock, with continuous dock banks and trailers backed in along BOTH
  long faces (east and west). An extensive marked trailer-parking yard lies
  east of the building; employee parking and the gated entrance are at the
  south end.
- **Gate close-up (z20, current 2026 Maxar):** The south truck-court entrance
  clearly shows a **guard booth standing in the middle of the truck driveway**,
  with traffic lanes splitting around it (inbound lanes marked with directional
  arrows) and yellow-hatched median islands on either side.
- **Street View:** Only a 2019 pano exists nearby — it predates the
  development (the site was still forest). No useful Street View of the gate;
  the determination rests on current satellite imagery plus the facility
  directory.

## Gate / guard-shack / dock determinations

- **truckGate = TRUE** — current satellite resolves a controlled gate at the
  south entrance; facility directory listings independently state "Check in is
  required at the security guard for appointments only."
- **guardShack = TRUE** — the mid-lane structure at the gate is a guard booth
  (~1-vehicle footprint, lanes routed around it).
- **remoteGs = FALSE** — a staffed booth is present.
- **dockDoors = 50+** — cross-dock building with dock banks down both long
  faces; ~130 doors total is an honest overhead estimate (loose).
- **shipRcvSeparate = TRUE** — cross-dock = two dock banks on opposite faces.
- **dropYard = TRUE / dropArea = 50+** — extensive marked trailer-parking lanes
  east of the building, full of tractorless trailers.
- **postGateStaging = TRUE, drivewayLong = TRUE** — deep paved truck courts
  inside the gate give 3+ trucks of stacking room before the docks.
- **entryExitTogether = TRUE** — one combined truck gate at the south end;
  lanes split around the booth, ~2 inbound + 1 outbound (estimates).
- **fastLaneOpportunity = TRUE** — wide gate apron with a multi-lane split
  around the booth leaves room for an express/bypass lane.
- **scale / multiStep = FALSE** — no weigh platform or second checkpoint seen.
- **railServed = FALSE** — no rail spur into the property (former Intel campus
  redevelopment).

## Yard zones & metrics

- **Perimeter:** ~47.10930–47.11520 N, −122.64000 to −122.63560 W — Building
  1's fenced property: building, both truck courts, the east trailer yard, the
  south gate. ≈ 54 acres.
- **truckGate:** Small box at the south entrance (guard booth + split lanes).
- **dropYards:** One — the large east trailer-parking yard.
- **dockAprons:** Two — one along the east dock face, one along the west.
- **staging:** Post-gate paved holding area just inside the south gate.
- **yardMetrics:** dockDoorCount ~130, trailersVisible ~90, capacity ~130,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~54, railServed false. Door
  and trailer counts are honest overhead estimates, flagged in
  `uncertainFields`.

## Web findings

- The Cubes at DuPont: 1.6M sq ft, 3 buildings, former Intel campus, Northwest
  Landing, DuPont WA. Building 1 = 747,488 sq ft, 100% leased to
  Kimberly-Clark (KCDC). Duke Realty bought the 1.6M sq ft park for $221M.
- KCDC facility directory: 1205 Wharf Rd, DuPont WA 98327; truck route via
  Wharf Rd; "check in required at the security guard, appointments only";
  immediate proximity to I-5, ~20 min from the Port of Tacoma.

## Final confidence

**HIGH.** The facility is positively identified — Building 1 of The Cubes,
documented by name, size and tenant — the gate and guard booth are clearly
resolved in current satellite imagery and corroborated by the facility
directory, and the cross-dock layout and yard zones read cleanly. The only
soft calls are the exact door/trailer counts, the inbound/outbound lane split,
and the Urban/Rural borderline (DuPont is a small city on the metro fringe).
