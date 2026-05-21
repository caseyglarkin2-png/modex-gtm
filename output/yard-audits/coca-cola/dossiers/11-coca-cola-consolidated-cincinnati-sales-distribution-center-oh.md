# Deep-Audit Dossier — Coca-Cola Consolidated, Cincinnati Sales & Distribution Center, OH

**Roster idx:** 11
**Facility type:** Sales / Distribution Center
**Confidence:** Medium

## Location resolution
Roster address: 1547 Kemper Meadow Dr, Cincinnati OH 45240 — in the Kemper
Meadow / Forest Park business park. The roster lat/lng (39.292889, -84.53697,
RANGE_INTERPOLATED) landed at the Kemper Meadow Dr intersection ~250m
southwest of the actual building, near an office building.

Locked center: **39.29470, -84.53630** — a large flex/warehouse building on
Kemper Meadow Dr, beside the Ronald Reagan Cross County Hwy. Identified as the
best candidate for the Coca-Cola Consolidated Cincinnati sales/distribution
center: satellite imagery shows white trailers and **red-cab Red Classic
tractors** (Coca-Cola Consolidated's logistics fleet) backed into the building's
NW dock row, plus a small trailer drop yard.

Building identity is MEDIUM confidence — no road-level Coca-Cola signage could
be confirmed because Street View on Kemper Meadow Dr is from 2019 and the dock
side is screened by mature trees.

## Key views
- **Building (z18):** One large flex/warehouse with an attached office wing;
  grey-roofed warehouse body, lighter office section, employee parking on the
  east and south.
- **NW dock face (z19/z20):** Dock-door row with ~10-15 trailers backed in
  (white + red Red Classic) and a small trailer drop yard along the apron.
- **Entrance (Street View 2019):** Open business-park driveways off Kemper
  Meadow Dr; an entrance monument sign with address numbers in the 1500s.

## Gate / guard-shack / dock determinations
- **truckGate: false.** No barrier arm, gate, or guard booth. Typical open
  business-park flex building; truck access via an open internal driveway.
  Listed uncertain because the dock side is tree-screened from Street View.
- **guardShack: false.** No booth seen; listed uncertain.
- **remoteGs: false** — no truck gate, so false by rule.
- **Docks:** ~10-15 dock doors on the NW face (band 10-25), single dock bank
  (shipRcvSeparate false).
- **drivewayShort: true** — modest apron, stacking room for only 1-2 trucks.

## Yard zones and counts
- **Perimeter:** ~11 acres (S 39.29360 / W -84.53740 / N 39.29570 / E
  -84.53520).
- **Drop yard:** small trailer-parking area on the NW apron.
- **Dock apron:** NW-face apron.
- **yardMetrics:** ~14 dock doors, ~12 trailers visible, ~20-trailer capacity,
  1 truck gate (open), 1 building, ~11 acres, no rail.

## Web findings
Coca-Cola Consolidated operates a Cincinnati sales/distribution center in the
45240 (Forest Park) area; no facility-specific operational detail was findable
in public sources. Kemper Meadow Dr is an established flex/industrial business
park.

## Final confidence
**Medium.** The facility type (sales/distribution flex building) and the
red Red Classic tractor fleet on the dock apron strongly indicate the correct
building, but signage could not be confirmed (tree-screened, dated Street
View). Dock count and gate verdict are best-effort estimates and are flagged
in `uncertainFields`.
