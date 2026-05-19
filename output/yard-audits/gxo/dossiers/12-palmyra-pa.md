# Deep-Audit Dossier — GXO Logistics Distribution Center, Palmyra PA (idx 12)

## Facility
- **Name:** GXO Logistics Distribution Center - Palmyra PA
- **Type:** Distribution Center
- **Address:** 500 N Lingle Ave, Palmyra, PA 17078
- **Resolved coordinates:** 40.31050, -76.61450
- **Maps:** https://www.google.com/maps/@40.31050,-76.61450,400m/data=!3m1!1e3

## Location confirmation
The roster lat/lng (40.31048, -76.614852) landed directly on a very large
white-roof distribution complex on N Lingle Avenue north of Palmyra PA. Web
research (D&B, Manta) identifies the address with the **Eastern Distribution
Center**, a Hershey-area distribution campus; GXO Logistics operates a DC at
500 N Lingle Ave (one of GXO's four PA facilities — alongside Middletown,
Carlisle and Bethlehem). The footprint is consistent: a single ~1.5M+ SF
distribution building surrounded by trailer yards. Locked center at the
building centroid 40.31050, -76.61450.

## Key views
- **z16 overview:** One enormous distribution building set in farmland, with a
  creek/pond along the north edge. Trailer parking wraps the building; access
  road comes from a signalized intersection at the SW.
- **z18 north face:** Long continuous dock-door bank with trailers backed in,
  facing the creek.
- **z18 south face:** Another long dock-door bank with trailers, plus a large
  employee car-parking lot.
- **z19 west face:** Dock doors with trailers; the curved access road feeds in
  from the SW signalized intersection.
- **z17/z18 east end:** Dock doors and a large trailer drop yard; a rail spur
  with rail cars runs along the SE edge.

## Gate / guard-shack / dock determinations
- **truckGate: false.** The access road runs from a public signalized
  intersection and wraps the building. No barrier arm, sliding gate, or
  checkpoint pinch-point appears at the property line in z19/z20 imagery, and
  there is no perimeter fence around the operational yard.
- **guardShack: false.** No 1-3-vehicle booth at the entrance or along the
  access road in z19 satellite or Street View.
- **remoteGs: false.** No gate, so no remote check-in inference.
- **Docks: "50+".** Continuous dock-door banks on the north, south, east and
  west faces; counted ~220 doors total (approximate). One of the largest dock
  configurations in the GXO batch.
- **shipRcvSeparate: true.** Dock banks are on physically separate building
  faces (notably the north and south banks), so shipping and receiving run from
  separate clusters.
- **Drop yard: yes / dropArea "50+".** Hundreds of trailers parked in dedicated
  drop lots on the north, east and west sides, distinct from active dock
  aprons.
- **railServed: true.** A rail spur with rail cars runs along the south/SE edge
  and enters the site footprint.

## Yard zones and counts
- **perimeter:** the full developed property — building + dock courts +
  trailer yards. ~668 m N-S x ~713 m E-W ≈ **117.7 acres**.
- **truckGate zone:** SW access-road connection at the signalized intersection
  (open, no structure).
- **dropYards:** four boxes — north creek-side yard (split into two), east-side
  yard, and a west-side yard.
- **dockAprons:** three boxes — north dock apron, south dock apron, west dock
  apron.
- **staging:** no distinct pre-gate staging; null.
- **yardMetrics:** ~220 dock doors, ~240 trailers visible, capacity ~350, 1
  main truck gate, 1 building, 117.7 acres, rail-served.

## Web findings
- 500 N Lingle Ave is associated with the Eastern Distribution Center / Hershey
  distribution campus in Palmyra PA; GXO operates a DC here. Phone
  (717) 508-5000. Limited public spec detail — counts here are from imagery.

## Confidence
**High.** Facility positively identified; imagery clear at z16-z20. Flagged
uncertain fields are the dock-door count, trailers-visible and parking-capacity
— all are honest overhead estimates on a campus far too large to count
exactly, but each is unambiguously in the 50+ band.

**3-line summary:**
- Gate: NO truck gate — open access road, no barrier or perimeter fence.
- Guard shack: NO — no booth anywhere on the access road.
- Confidence: HIGH.
