# Deep-Audit Dossier — Target Food Distribution Center, Lake City FL (#23)

**Facility:** Target Food Distribution Center #3892 (T3892)
**Type:** Food Distribution Center (refrigerated)
**Address of record:** 3049 N US Hwy 441 / 309 NE Tammy Ln, Lake City, FL 32055
**Resolved center:** 30.2318, -82.6360
**Method:** deep-audit (satellite z14-z21 + Street View 2013/2026 + web research)
**Confidence:** HIGH

---

## 1. Location resolution (the geocode was wrong)

The supplied geocoded point (30.44245, -82.646011) landed ~28 km **north** of
the facility in open pine forest along US-441 — confirmed by satellite at z14
and z17 (nothing but trees and the divided highway; `overview-z17.png`,
`wide-z14.png`). No 460k sq ft warehouse anywhere near it.

Resolution path:
- WebSearch confirmed T3892 is a **460,000 sq ft refrigerated warehouse, 80 ft
  ceilings**, opened 2008 (FleetOwner, Circuit Electric, USA.com).
- A second registered address surfaced — **309 NE Tammy Ln** (Waze) — placing
  it in NE Lake City near I-75, not 28 km north.
- Wikimedia Commons "Target Distribution Center, Lake City.JPG" carried camera
  geocoords **30°13'52.28"N, 82°38'18.1"W → 30.2312, -82.6383**.
- Probing there (`wiki-z15.png`) immediately revealed the large warehouse with
  trailer rows. Final building center fixed at **30.2318, -82.6360**.
- **Positive ID:** a red Target bullseye sign stands at the site entrance,
  visible in 2026 Street View (`sv-east.png`).

The facility sits just SW of the I-75 / US-90 interchange, fronting US-441
(NW Lake Jeffery Rd corridor) on its west side, bounded by woods and a
retention pond on the east.

---

## 2. Key views

- `full-z16.png` / `bldg-z17.png` — whole footprint: single large warehouse
  oriented ~N-S (rotated ~6° E of north), white refrigerated roof, two round
  refrigeration/water tanks at the north end (`north-z18.png`).
- `westdock-z18.png` / `westwall-z18.png` — **west dock face**: long apron with
  two rows of trailers backed in; additional trailer storage rows toward the
  US-441 buffer. Dozens of trailers.
- `yardentry-z19.png` — **east/south dock face**: dock doors with a trailer
  backed in, separate from the west bank.
- `entrance-z18.png` / `southcourt-z18.png` — SW office side: large employee
  car park; single truck/employee access drive off the E-W road.
- `roadjunction-z20.png` / `gate2-z20.png` / `canopy-z21.png` — the interior
  **checkpoint**: divided entry/exit drive with chevron-striped median, painted
  stop bar, and a small canopy structure at the yard-entry pinch point
  (~30.2312, -82.6345).
- Street View (`sv-entrance-n.png`, `sv-drive-in.png`, `sv-yard.png`,
  `sv-east.png`, `sv-checkpoint.png`) — entrance drive looking in; chain-link
  perimeter fencing with retention pond; Target bullseye sign.

---

## 3. Gate / guard / dock determinations

- **truckGate = TRUE.** Controlled truck entrance. The drive off the public
  road splits into divided inbound/outbound lanes with a chevron-striped median
  and a painted stop bar, leading to a checkpoint pinch point at the yard
  entrance. The entire parcel is chain-link fenced (clearly visible in 2013/2026
  Street View). The public-road junction itself is open pavement (no arm at the
  road), but truck access into the yard is funneled through the interior
  controlled checkpoint.

- **guardShack = FALSE (uncertain).** No staffed booth of the classic 1-3-car
  footprint with multi-side windows is clearly resolved. At z21 the checkpoint
  shows only a small canopy/structure with hatched striping — consistent with an
  unmanned check-in canopy/kiosk rather than a manned shack. Resolution is
  borderline; flagged in `uncertainFields`.

- **remoteGs = TRUE (uncertain).** Set because a controlled gate/checkpoint
  exists but no manned guard shack is confirmed, implying kiosk/canopy/app
  check-in. If the canopy turns out to be staffed, this flips to guardShack.

- **dockDoors = 50+.** A 460k sq ft refrigerated DC with a long west dock wall
  (two trailer rows backed in) plus east and south dock banks. Honest overhead
  estimate ~70 doors.

- **dropArea / dropYard = 50+ / TRUE.** Extensive marked trailer-storage rows
  along the west apron and east side; well over 50 trailer stalls.

- **shipRcvSeparate = TRUE (uncertain).** Distinct dock clusters on the west
  wall vs. the east/south faces suggest separate shipping/receiving; inferred.

- **postGateStaging = TRUE / drivewayLong = TRUE.** A deep paved truck court
  between the checkpoint and the dock aprons can hold 3+ queued trucks.

- **fastLaneOpportunity = TRUE.** Wide divided entry apron with spare paved
  width to add a bypass/express lane.

- **entryExitTogether = TRUE, entryLanes 1 / exitLanes 1** at one entry point.

- **urbanRural = Rural.** Edge-of-town setting: woods, retention pond, and
  scattered rural residential along US-441.

- **scale = FALSE (uncertain).** No truck scale pad clearly identified.

---

## 4. Yard zones & counts

- **perimeter** — fenced parcel traced as a 6-vertex oriented ring; area
  **≈ 89.4 acres** (Shoelace over the ring).
- **truckGate** — rotated quad along the divided entry/exit drive.
- **dropYards** — west trailer-storage rows (1 ring).
- **dockAprons** — west dock apron + east/south dock apron (2 rings).
- **streetViewMeta** — all zones reference entrance pano
  `ezpN_K3qtb9Iv1Dt6pVD1A` (2026-01), the only Street View coverage near the
  site; headings: perimeter 343°, truckGate 10°, dropYards 316°, dockAprons 321°.
- yardMetrics: dockDoorCount ~70, trailersVisible ~110, capacity ~160,
  truckGateCount 1, buildingCount 1, railServed false.

---

## 5. Web findings

- Target Food Distribution Center #3892, 460,000 sq ft refrigerated, 80 ft
  ceilings; opened ~2008 as Target's first perishables DC (Swisslog-automated),
  serving the Southeast (FleetOwner, MWPVL, Circuit Electric).
- ~500-999 staff; phone (386) 466-3600 (Manta).
- Two address records (3049 N US-441 and 309 NE Tammy Ln) both point to this
  NE-Lake-City parcel.

---

## 6. Final confidence: HIGH

Facility positively identified (Target sign + Wikimedia geocoords + footprint
matching a 460k sq ft refrigerated DC). Gate/dock/yard layout read clearly.
Uncertain only on whether the interior checkpoint canopy is manned (guardShack
vs remoteGs), exact ship/rcv separation, and presence of a scale — all flagged.
