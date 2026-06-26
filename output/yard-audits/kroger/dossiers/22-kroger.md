# Deep-Audit Dossier — idx 22 — Tamarack Farms Dairy (Kroger)

**Facility:** Tamarack Farms Dairy — Kroger fluid-dairy plant
**Address:** 1701 Tamarack Road, Newark, OH 43055
**Resolved center:** 40.03905, -82.46075
**Method:** deep-audit · **Confidence:** high

## Step 0 — Location confirmation
Given coords (40.040189, -82.460103) landed at the north edge of the property,
over the employee lot. Probing satellite z17–z20 and walking Street View around
the point positively identified the building: a large blue-clad dairy plant with
a bank of milk silos. Street View signage reads **"Kroger Manufacturing — NOW
HIRING, jobs.kroger.com"** on the perimeter fence, confirming the Kroger plant.
Web search corroborates: Tamarack Farms Dairy, 1701 Tamarack Rd, Newark OH — the
largest fluid-dairy producer in Ohio, ~20-acre plant footprint, recently expanded
($77M aseptic milk line, 2025). True plant-building center sits ~150 m S of the
supplied point at 40.03905, -82.46075.

## Setting
Edge-of-town industrial park in west Newark, OH. The plant fronts an internal
industrial-park street (not a major public road); ball fields and farmland lie to
the S and E. Judged **Rural** (small-city industrial). A rail line runs E–W just
south of the property along the boundary, but no spur enters the building — the
plant is truck-served (`railServed: false`).

## Gate / guard determination
- **Perimeter fence:** Continuous chain-link fence wraps the property on the N and
  E sides — confirmed in multiple 2019 Street View frames (employee lot, plant and
  silos all sit behind the fence; "NO TRESPASSING / PRIVATE" sign on the fabric).
- **Truck gate:** A single controlled entrance drive breaks the fence off the
  internal street on the NE/E side. The drive narrows to a checkpoint pinch-point.
  `truckGate: true`.
- **Guard shack:** z21 satellite at ~40.0402, -82.4601 shows a small ~1-vehicle-
  footprint rectangular booth seated in the median of the entrance drive, with the
  driveway splitting around it — the classic guarded-gate signature.
  `guardShack: true`, `remoteGs: false`.
- Entry/exit share the one gate group (`entryExitTogether: true`, 1 in / 1 out).
  The internal approach from gate to docks is deep and can stack 3+ trucks
  (`drivewayLong: true`); paved holding inside the gate before the docks
  (`postGateStaging: true`). No spare paved width for an express bypass at the
  gate (`fastLaneOpportunity: false`). Gate sits well off the public road inside
  the park with ample internal stacking, so not backup-sensitive.

## Docks / yard / counts (overhead estimates)
- **Docks:** A loading-dock bank runs along the **east face** of the plant with
  trailers backed in. Band **25–50**; count ~28. Single dock cluster (no separate
  ship/rcv face → `shipRcvSeparate: false`).
- **Drop yards:** Extensive trailer storage — long parallel rows of drop trailers
  on the **north** apron and along the **east** side of the building. 70+ trailers
  visible; `dropArea: 50+`, `dropYard: true`. Capacity ~110.
- **Buildings:** One large interconnected plant building (processing wing + main
  production hall + dock wing). Adjacent standalone white warehouses further west
  are separate neighboring businesses, not part of this fenced parcel.
  `multipleFacilities: false`.
- **No truck scale** visible in the truck path (`scale: false`); no second
  checkpoint after the gate (`multiStep: false`).
- **Site area:** ~31 acres from the traced fenced perimeter (web cites ~20 acres
  for the dairy footprint proper).

## Street View
Best driver-arrival frame: road pano `SCGhH3LRjHv-g83pVQNQAQ` (2019-09) at
40.04066, -82.46072 on the entrance street. truckGate heading 139° (toward the
gate booth at ~40.0402,-82.4602); perimeter heading 220° (toward the plant).

## Web findings
Kroger's Tamarack Farms Dairy, Newark OH — largest fluid-dairy producer in Ohio,
serves ~160 Kroger stores across OH/WV plus e-commerce. Built 1978; ~$77M
expansion adding a 40,000 sq ft aseptic milk line opened 2025 (creamers,
half-and-half, heavy whipping cream; first Midwest aseptic line for Kroger).

## Final confidence
**High.** Facility unambiguously identified (Kroger signage + silos + address +
web). Gate, perimeter fence and guard booth all confirmed across satellite and
Street View. Dock/trailer/area counts are honest overhead estimates and are
flagged in `uncertainFields`.
