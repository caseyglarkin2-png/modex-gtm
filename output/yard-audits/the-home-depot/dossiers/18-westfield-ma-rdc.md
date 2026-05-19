# Deep-Audit Dossier — Home Depot RDC, Westfield MA (idx 18)

**Facility:** Home Depot Rapid Deployment Center (RDC #5221)
**Address:** 50 Campanelli Drive, Westfield, MA 01085
**Resolved center:** 42.17030, -72.73620
**Confidence:** High

## Location resolution
The roster coordinate (42.169402, -72.734316) landed at the SE truck-entrance
end of the property, within ~150 m of the building. Web research confirms 50
Campanelli Drive is Home Depot RDC #5221 — a Rapid Deployment Center operating
24/7, noted as the #1 RDC in HD's network in 2020. Satellite imagery shows one
very large white distribution building running NW-SE in an edge-of-town
industrial park surrounded by woodland on the outskirts of Westfield. The locked
center is the building's centroid.

## Key views
- **z16/z17 wide:** One long white RDC building running NW-SE; dock doors on both
  long faces with trailers backed in; employee parking and a trailer drop yard at
  the SW end; the property is ringed by woodland.
- **z21 truck gate (42.16935, -72.73455):** A clear checkpoint — striped/painted
  pinch-point lane markings across the truck drive, with a small light-coloured
  booth and a car parked beside it. Property fenceline visible running off the
  checkpoint.
- **z20 roster point:** Confirms the checkpoint — yellow striped lane markings and
  a vehicle stopped at the gate on the SE access drive.
- **z18 NE building end:** Long rhythm of dock doors with trailers backed in,
  employee parking, plus a yard structure near the dock-apron curve.
- **z18 SW yard:** Curved truck driveway and trailer-storage rows at the SW end.
- **Street View (2023-10, Campanelli Drive):** The public-road frontage is
  heavily wooded; the entrance drive runs a long way back through trees before
  reaching the gate.

## Determinations
- **truckGate = true.** A striped checkpoint pinch-point with painted lane
  markings controls the SE truck drive — a clear controlled entrance.
- **guardShack = true.** A small light-coloured booth sits directly at the
  checkpoint with a parked car beside it — a staffed guard booth, not the main
  building. `remoteGs` is therefore false.
- **multiStep = false.** Single checkpoint stage; no second booth or scale house
  observed.
- **scale = false.** No truck scale pad seen.
- **shipRcvSeparate = true.** Cross-dock RDC layout — dock doors on both long
  faces of the building.
- **backupSensitive = false.** The gate sits far back from Campanelli Drive
  behind a long wooded approach drive; a truck queue would not spill onto the
  public road.
- **drivewayLong = true.** Long approach plus deep internal yard provide ample
  3+ truck stacking room.
- **urbanRural = Rural.** Edge-of-town industrial park ringed by woodland on the
  outskirts of Westfield.

## Yard zones and counts
- **Perimeter:** ~50 acres capturing the RDC building, parking and drop yard.
- **Dock doors:** 50+ band; ~110 doors estimated across both long faces.
- **Drop yard:** 25-50 band; the SW-end trailer rows hold ~95 trailers visible,
  capacity ~130.
- **Buildings:** 1 (the HD RDC). Neighbouring buildings to the NE are separate
  industrial-park tenants, excluded from the HD perimeter.
- **Rail:** No spur enters the property — not rail-served.

## Web findings
TruckMap / WarehouseRating / SupplierWiki confirm: RDC #5221, 50 Campanelli
Drive, 24/7 operation, gate-and-entrance security, first-come-first-served
appointments, no overnight parking — and recognition as HD's top-performing RDC
in 2020. The "gate and entrance security" note corroborates the satellite
guard-shack finding.

## Final confidence: High
Facility identity and gate/guard determination are unambiguous. Only the exact
inbound/outbound lane counts and the trailer drop-area band are overhead
estimates.
