# SC Johnson Professional Plant — Stanley, NC (sc-johnson idx 4)

**Facility type:** Manufacturing Plant (Professional — hand care / floor care)
**Roster address (incorrect):** 100 Technology Center Dr, Stanley, NC 28164
**Verified address:** 1100 S Highway 27 (NC-27), Stanley, NC 28164
**Resolved center:** 35.34030, -81.07800
**Confidence:** High

## Location resolution
The roster's street address ("100 Technology Center Dr") could not be
confirmed and the roster coordinate (35.353526, -81.090317) was an
APPROXIMATE city-centroid landing in downtown Stanley — not the plant.
Web research resolved the correct facility: SC Johnson Professional USA's
Stanley plant is the **former Deb USA plant at 1100 S Highway 27 (NC-27)**,
confirmed by the Waze business listing, the LoopNet property record (1100 S
Highway 27, APN/Parcel 176716, a 73,956 sq ft industrial building built
1986) and FDA / Panjiva records for "Deb USA Inc., 1100 S. Highway 27,
Stanley NC". SC Johnson Professional acquired Deb Group in 2015. The building
was located by probing the SE Stanley industrial corridor along NC-27 and
positively identified in Street View — a long industrial building with a
red-trimmed dock bank fronting the highway. Locked center at
~35.3403, -81.0780.

## Key views
- **Wide satellite (z14-16):** Stanley is a small town; the industrial
  corridor sits SE of downtown along NC-27 and the rail line.
- **Plant building (z17-19):** a long single industrial building with a
  bank of dock doors on the NE face fronting NC-27, tanks/silos on the SW
  corner, employee parking on the north, and a rail line along the west edge.
- **Dock face Street View:** a continuous bank of ≈10-12 dock doors
  (red-trimmed dock wall) opens directly onto an open paved truck apron;
  NC-27 runs immediately in front. No fence, no gate, no guard booth.
- **SW corner (z19):** tank/silo structures (raw-material storage consistent
  with a soap / chemical plant) and the rail line.

## Gate / guard-shack / dock determinations
- **truckGate = false.** No barrier arm, sliding gate or checkpoint. The dock
  face fronts NC-27 directly; trucks pull straight in off the public highway
  onto an open apron.
- **guardShack = false.** No guard booth anywhere on the property.
- **remoteGs = false.** No gate, so no kiosk/remote check-in implied.
- **dockDoors = "10-25".** A continuous bank of ≈10-12 dock doors on the NE
  building face, confirmed in Street View.
- **dropArea = "0-10" / dropYard = false.** Only a handful of trailers on the
  apron; no dedicated trailer-storage lot.
- **drivewayShort = true.** The apron between NC-27 and the docks is shallow —
  room for only 1-2 trucks before the doors.
- **shipRcvSeparate = false.** One dock bank on one face.
- **multipleFacilities = false.** One ~73,956 sq ft building.
- **scale = false.** No truck scale observed.
- **railServed = true (uncertain).** A rail line runs immediately along the
  west property edge; in-property spur not definitively confirmed.
- **urbanRural = "Rural".** Small-town Stanley, NC, surrounded by fields and
  woods.

## Yard zones & counts
- **Perimeter:** the small operational parcel (~14 acres estimated) around
  the building.
- **Truck gate:** none — `truckGate` geofence left null.
- **Drop yard:** one small boxed zone (apron / east-side trailers).
- **Dock apron:** one boxed — the NE dock face.
- **Staging:** the paved apron in front of the docks.
- **yardMetrics:** ≈12 dock doors, ≈10 trailers visible, ≈20 trailer
  capacity, 1 (open, uncontrolled) truck entrance, 1 building, ~14 acres,
  rail-served true (uncertain).

## Web findings
SC Johnson Professional manufactures hand-care and floor-care products at
Stanley with ~70 employees (D&B, Manta, NC Biotech Center, scjp.com). The
site is the former Deb USA plant, brought into SC Johnson via the 2015 Deb
Group acquisition; SC Johnson Professional's North American HQ is in
Charlotte, NC. The Stanley facility recently completed office, collaboration
and breakroom upgrades. It is the smallest of SC Johnson's four audited
plants — a single 73,956 sq ft building, no gate, modest dock count.

## Final confidence: High
Facility positively re-identified despite the bad roster address; the
no-gate, no-guard, highway-fronting dock layout is clearly visible in Street
View. Door/trailer counts, site acreage and in-property rail are honest
overhead estimates flagged uncertain.
