# Deep-Audit Dossier — Home Depot RDC, Elwood IL (idx 16)

**Facility:** Home Depot RDC — Elwood, IL (DC #5851; co-located SDC #5852)
**Address:** 2950 Centerpoint Way, Elwood, IL 60421 (Joliet/Elwood, 60436)
**Resolved coordinates:** 41.44010, -88.14320
**Confidence:** High

## Location confirmation
Roster supplied 41.440126, -88.144081 (ROOFTOP, moved 9468 m — the largest move
in the account), which landed between two large warehouses inside the
CenterPoint Intermodal Center. Probing satellite at zooms 14-19 and
cross-checking against the leasing record resolved the ambiguity: CenterPoint's
property page lists 2950 CenterPoint Way as a **657,600 sq ft building on ~55
acres** — that footprint matches the *western, slightly smaller, lighter-roofed*
N-S building, not the much larger building immediately to its east (a separate
facility). The western building shows dock doors with trailers along both long
faces and a guarded gate complex on the south — a Home Depot RDC. Web search
confirmed 2950 CenterPoint Way as HD RDC #5851. Locked center:
41.44010, -88.14320.

## What the imagery showed
- **Wide (z14-16):** The HD RDC is a long N-S cross-dock building inside the
  CenterPoint Intermodal Center. Continuous dock-door rhythm with trailers
  backed in along both the long east and long west faces. Trailer drop-yard
  rows flank both faces. The much larger building to the east is a separate
  tenant.
- **Truck gate (z19):** A clear guarded gate complex on the south side — a
  canopy-roofed guard booth straddling the gate lanes, multiple inbound and
  outbound lanes, and a chevron-striped apron. Trucks are visibly queued through
  the checkpoint; more trucks staged on the approach road before the gate.
- **Street View (May 2025):** Panos on the perimeter road show the RDC across a
  retention pond — the long dock face, trailers, and a large employee parking
  lot fronting the building.
- **Drop yard:** Dense trailer rows flank both long faces — 50+ band.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Distinct guarded gate complex on the south side with a
  striped apron and multiple lanes.
- **guardShack = true.** A canopy-roofed guard booth straddling the gate lanes
  is plainly visible in z19 imagery. remoteGs = false accordingly.
- **preGateStaging = true.** Trucks queued on the approach road outside the gate.
- **dockDoors = 50+.** Cross-dock RDC, well over 100 dock doors across both long
  faces; trailers backed in confirm active docks.
- **shipRcvSeparate = true.** Cross-dock — receiving on one long face, shipping
  on the opposite; two distinct dock banks.
- **dropYard = true / dropArea = 50+.** Dedicated trailer drop-yard rows.
- **fastLaneOpportunity = true.** Multi-lane gate (≈3 inbound) with wide striped
  apron — room for an express bypass lane. drivewayLong = true,
  postGateStaging = true.
- **railServed = false.** The CenterPoint Intermodal Center has major intermodal
  rail yards, but no rail spur runs into this RDC's own property.

## Yard zones & counts
- Perimeter geofence captures the property (~60 acres): building, both dock
  aprons, drop-yard rows on both faces, gate apron, and employee parking.
- dockDoorCount ≈ 150 (estimate across both long faces).
- trailersVisible ≈ 280; trailerParkingCapacity ≈ 360.
- buildingCount = 1; truckGateCount = 1; railServed = false.

## Web findings
SupplierWiki HD DC list confirms RDC #5851 at 2950 CenterPoint Way; a co-located
SDC #5852 operates at the same address. CenterPoint Properties' own leasing page
gives the 657,600 sq ft / 55-acre footprint that let me disambiguate the
building. The facility operates 24 h Mon-Fri. The CenterPoint Intermodal Center
(Joliet/Elwood) is one of the largest inland logistics parks in North America.

## Final confidence
High. Building disambiguated against the leasing record and confirmed as HD RDC
#5851; the guarded gate complex (canopy guard booth, multi-lane striped apron,
queued trucks) is clearly visible in z19 imagery. Gate lane counts are
approximate (listed in uncertainFields).
