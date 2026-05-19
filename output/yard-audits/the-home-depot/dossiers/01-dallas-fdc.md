# Deep-Audit Dossier — Home Depot FDC, Dallas TX (idx 1)

**Facility:** Home Depot Flatbed Distribution Center (DC #5824) — HD's first FDC
**Roster address:** 9222 W Jefferson Blvd, Dallas, TX 75211
**Roster coords:** 32.747894, -96.923588 (geocoding-api, RANGE_INTERPOLATED, movedMeters 2)
**Final confidence:** LOW — facility not positively resolved

---

## Step 0 — Location resolution: UNRESOLVED

The roster's geocoded coordinates do **not** point at a distribution center.
Satellite probes at 32.747894, -96.923588 (zoom 15 through 19) show a small
empty dirt lot at a multi-leg road intersection, flanked by auto-salvage yards,
small commercial buildings, and a residential subdivision. There is no
800,000 sq ft building anywhere near that point — confirmed across z15 (≈2.5 km
field of view) and z19 imagery.

The address itself is real (W Jefferson Blvd, in the Mountain Creek industrial
district of southwest Dallas), but the geocode appears to be a street-range
interpolation that landed on an undeveloped parcel.

Public sources conflict on the FDC's true address:
- **SupplierWiki HD DC list** ties DC #5824 to **9222 / 9302 W Jefferson Blvd,
  Dallas 75211**.
- **Press coverage** (multiple outlets, 2020 opening) places HD's first FDC at
  **3730 / 4721 Mountain Creek Parkway, Dallas 75236**.

These are both in the same southwest-Dallas Mountain Creek industrial corridor
but ~2-3 km apart. I probed the Mountain Creek Parkway corridor extensively
(z14-z18). It contains **several** very large warehouses; the single largest
dock-and-drop-yard building I found sits at ≈32.7415, -96.9755 — a long white
warehouse with dock doors along its south face, trailers backed in, and a large
trailer drop yard to its east. That building is a plausible FDC candidate, but
**I could not positively confirm it is HD-operated**: no HD signage was legible
in the available (distant) Street View panos, and the FDC's signature
drive-through tunnel was not clearly identifiable from overhead imagery on any
single candidate building.

**This site is flagged for human review.** A Google Maps place-ID lookup of
"Home Depot FDC Dallas" or a county parcel record search would resolve it.

## What the imagery showed (best-candidate building, unconfirmed)

- z16-z18 satellite of the Mountain Creek corridor: a cluster of large
  logistics warehouses. The leading candidate (≈32.7415, -96.9755) is a long
  building with a regular rhythm of dock doors on its south elevation, trailers
  backed in, and an extensive paved trailer yard on its east side holding many
  trailers without tractors (clear drop-yard signature).
- Street View on the frontage road was too distant to read tenant signage.

## Gate / guard-shack determination

Could not be determined from confirmed imagery. The classification values in
the JSON are **inferred from the HD FDC archetype** (an enterprise drive-through
flatbed building handling 65-75 trucks/day) and are not evidence-backed:
- `truckGate: true`, `remoteGs: true` — HD distribution facilities are
  universally gated; assumed remote/kiosk check-in absent a confirmed guard
  booth.
- `fastLaneOpportunity: true`, `drivewayLong: true`, `postGateStaging: true` —
  FDC throughput design implies deep internal staging and bypass-lane room.

## Yard zones and counts

All `yardMetrics` are FDC-archetype estimates, not measured from confirmed
imagery: ~60 dock doors, ~90 trailers visible, ~200 trailer capacity, ~70 acre
site, single building, not rail-served.

## Web findings

- HD opened its first FDC in Dallas in 2020: an 800,000 sq ft drive-through
  building where flatbed trucks drive through the middle and are loaded from
  both sides with lumber, drywall, concrete, roofing, insulation.
- Handles 65-75 flatbeds/day, serving customers within a 75-mile radius.
- Part of HD's ~$1.2B program to build ~150 supply-chain facilities.
- Driver-forum chatter references gate check-in at HD Dallas DCs but does not
  pin the FDC building.

## Final confidence: LOW

The facility exists and is operational, but its exact building could not be
positively identified. Coordinates and all 22 classification fields plus
yardMetrics are best-estimate / archetype-inferred and should be re-audited once
the correct building is confirmed.
