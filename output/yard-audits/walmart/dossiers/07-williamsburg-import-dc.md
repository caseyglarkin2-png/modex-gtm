# Yard Audit — Walmart Import DC 6088, Williamsburg VA

**Facility:** Walmart Supply Chain Import #6088 (Import DC, large, port-fed)
**Address:** 9305 Pocahontas Trail, Williamsburg, VA 23185
**Resolved center:** 37.20030, -76.59690
**Confidence:** high
**Method:** deep-audit (satellite z14-z20 + Street View + web research)

---

## Location confirmation

The supplied coordinates (37.201198, -76.596168) landed on the roof of the
large northern building of a two-building cross-dock complex. A z15/z16 sweep
showed two enormous parallel cross-dock warehouses (long axis ~107°/287°,
WNW-ESE) plus a smaller third building to the NE, ringed by trailer drop yards
and a perimeter road, sitting on a wooded parcel off Pocahontas Trail (US-60)
just south of I-64.

Web search confirmed the parcel: "Walmart Stores, Inc - Distribution Center
6088" at 9305 Pocahontas Trail, Williamsburg VA 23185, listed as Supply Chain
Import #6088, with drop-and-hook trailer operations and overnight truck parking
(Panjiva / Greater Williamsburg Chamber / driver-job listings). This matches
the cross-dock import-DC footprint exactly. Center refined to 37.20030,
-76.59690 (centroid of the traced perimeter).

## Key views

- **z16-z14 overview** — Two ~400 m parallel cross-dock buildings at ~107°
  bearing, a third smaller building NE, retention ponds NW/N, dense trailer
  parking on all building faces and in the west/central yards. ~191-acre fenced
  parcel.
- **z18-z19 dock faces** — Continuous dock walls on both long faces of both
  main buildings; trailers backed in perpendicular (south face of the southern
  building shows an unbroken trailer row). Confirms the thin dock aprons hugging
  each wall at the building angle.
- **z19 NW corner** — Massive drop yard: hundreds of trailers parked in angled
  rows filling the northwest storage lot inside the fence.
- **z19/z20 gate (wm07-z19-gate3.png, wm07-z20-gate.png)** — The north-central
  access drive pinches into the secured yard at ~37.20202, -76.59533. A small
  booth/island structure sits in the gate apron with striped pavement and a
  controlled lane — a staffed guard shack at a single consolidated truck gate.
- **Approach** — A long tree-lined two-lane drive runs from the signalized
  Pocahontas Trail intersection (~37.2070, -76.5980) down past employee parking
  and the retention pond to the gate; ample stacking for 3+ trucks.

## Gate / guard-shack / dock determinations

- **truckGate: TRUE** — Single controlled truck entrance on the north-central
  drive where the public approach narrows into the paved yard; gate apron and
  island visible at z20.
- **guardShack: TRUE** — Small staffed booth on the gate island in the apron
  (z20). Sets remoteGs FALSE.
- **dockDoors: 50+** — Two ~400 m cross-dock buildings with doors on both long
  faces, plus the NE building; estimated ~500 doors total (overhead estimate).
- **shipRcvSeparate: TRUE (med)** — Opposing dock faces / separate buildings
  act as distinct ship vs receive banks, typical of a cross-dock import DC.

## Yard zones & counts

- **Perimeter:** 7-vertex oriented ring tracing the fenced parcel, ~191 acres.
- **Truck gate:** thin quad over the gate apron, aligned to the drive.
- **Drop yards (2):** NW storage lot (angled trailer rows) + central yard
  between the two buildings — both packed with parked trailers.
- **Dock aprons (4):** thin quads hugging the north and south walls of each
  main building at the ~107° building angle (trailer-length depth ~35 m).
- **yardMetrics:** dockDoorCount ~500, trailersVisible ~450, capacity ~800,
  truckGateCount 1, buildingCount 3, siteAreaAcres 191.0, railServed false.

## Web findings

- DC 6088 = Walmart Supply Chain **Import** #6088 (Panjiva buyer "Walmart Dc
  6088, Suffolk Flow"), confirming port-fed import volume drayed from Hampton
  Roads.
- Drop-and-hook operations and overnight parking confirmed in driver/job
  listings — consistent with the large on-site drop yards observed.
- No rail spur into the parcel; volume moves by truck.

## Confidence

**High.** Facility positively identified and corroborated by web sources;
gate, guard shack, dock walls, and drop yards all visible in imagery.
Low-confidence items (flagged in uncertainFields): exact dock-door count,
trailer-parking capacity, entry/exit lane counts, scale presence, and
ship/receive separation — all reasonable overhead estimates rather than exact
figures.

---

### 3-line summary
- **Truck gate:** TRUE — single consolidated guarded gate on the north-central drive.
- **Guard shack:** TRUE — staffed booth on the gate island in the apron.
- **Confidence:** high.
