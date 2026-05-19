# Deep-Audit Dossier — Honda Marysville Motorcycle Plant (MMP), Marysville OH (idx 12)

## Facility
- **Name:** Honda - Marysville Motorcycle Plant (MMP)
- **Type:** Motorcycle / Powersports Assembly Plant (historical) — now vehicle
  suspension sub-assembly
- **Address:** 24000 Honda Parkway area, Marysville, OH 43040 (co-located on the
  Marysville complex)
- **Resolved coordinates:** 40.279000, -83.502500 (eastern wing of the Marysville
  Auto Plant complex — the historical MMP building)

## Step 0 — Location confirmation
The roster supplied the MAP coordinates (40.274666, -83.503609) for the MMP, and
flagged it "co-located on the Marysville complex." Web research (Wikipedia,
Honda) confirms the Marysville Motorcycle Plant was Honda's first US plant (1979),
ceased motorcycle production in June 2009, and was converted to vehicle
suspension sub-assembly. Crucially, it is "located at the same facility as the
Marysville Auto Plant" — it is the eastern wing of one contiguous building
footprint, not a separable standalone plant. Satellite at z15-z20 confirms a
single vast connected manufacturing complex. Coordinates were locked on the
eastern wing and its associated east-side truck/trailer/rail yard.

This is the same physical complex as roster idx-1 (MAP). There is no
independently-identifiable "motorcycle plant" yard today.

## Key views
- **z15 wide:** Single enormous contiguous building complex with an oval test
  track to the SE, surrounded by open Ohio farmland.
- **z16/z17 complex:** Hundreds of long dock-door banks, large employee parking
  lots on the south, and a rail spur and massive trailer drop yard on the east.
- **z18 east drop yard:** Marked trailer drop yard holding hundreds of trailers
  in dense rows; checkpoint/booth-footprint structures at the yard access.
- **z19/z20 dock views:** Long dock-door banks with trailers backed in along
  multiple eastern building faces.
- **Street View (Honda Parkway, 2021):** Signalized, controlled entrances with
  guard-booth structures visible across broad setback lawns. No Street View
  coverage exists inside the secured property.

## Gate / guard-shack / dock determinations
- **truckGate = true (medium confidence).** The MAP/MMP complex is a fully
  guarded, fenced auto-manufacturing campus; Honda Parkway entrances are
  signalized and controlled, and satellite shows checkpoint/booth structures at
  the truck-yard access. No interior Street View exists to confirm a specific
  barrier arm, hence medium confidence.
- **guardShack = true (medium confidence).** Small booth-footprint structures at
  the truck-yard checkpoint on satellite, consistent with staffed guard booths
  standard at auto plants of this scale.
- **remoteGs = false.** Guard booths present.
- **dockDoors = 50+.** 90+ doors estimated across the eastern wing's faces.
- **dropArea = 50+.** Hundreds of trailers in the east-side marked drop yard.
- **dropYard = true.** Dedicated multi-row trailer-storage yard.
- **shipRcvSeparate = true.** Dock activity across physically separate banks.
- **railServed = true.** Rail spur runs into the east side of the complex.

## Yard zones and counts
- **Perimeter:** ~130 acres — captures the MMP eastern wing plus its associated
  east-side truck/trailer/rail yard (a subset of the much larger overall complex).
- **Drop yards:** two boxes — the large east drop yard and a north trailer row.
- **Dock aprons:** two boxes along the eastern building faces.
- **Staging:** an internal holding apron east of the building.
- **Truck gate box:** the controlled Honda Parkway entrance area.
- **yardMetrics:** ~90 dock doors, ~320 trailers visible, ~450 capacity, 3 truck
  entrances, 1 building (the MMP wing), ~130 acres, rail-served.

## Web findings
- MMP opened 1979 as Honda's first US plant; motorcycle production ended June
  2009; building repurposed for suspension sub-assembly (Accord, Acura TL/RDX).

## Final confidence
**Medium.** The facility identity is well established, but the MMP is not a
separable site — it is an integral wing of the Marysville Auto Plant complex,
and there is no Street View coverage inside the secured perimeter to confirm the
exact gate/booth hardware. Gate and guard-shack calls rest on satellite evidence
plus the universal practice at auto plants of this scale. Flagged accordingly.
