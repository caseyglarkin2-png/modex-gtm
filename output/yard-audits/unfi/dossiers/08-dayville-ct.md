# UNFI — Dayville CT DC (idx 8)

**Address:** 260 Lake Rd, Dayville, CT 06241 (Killingly)
**Resolved center:** 41.86310, -71.90720
**Confidence:** High

## Location confirmation
The roster coordinate (41.863086, -71.906995) landed directly on the facility.
Web search corroborated the address — "UNFI Dayville Warehouse / Distribution
Center, 260 Lake Rd, Dayville CT 06241," a Teamsters-represented food-wholesale
DC. Satellite at z16–z20 positively identified a large distribution building
(brown roof with extensive rooftop solar) set in an edge-of-town industrial
park beside a reservoir, with two trailer drop yards and dock banks. A separate
older warehouse with its own trailer parking sits immediately north on the same
parcel cluster.

## Site layout
- **Main DC building** — single large rectangular footprint, ~brown roof with a
  large rooftop solar array. Dock doors run along the **south face** and wrap
  onto the **west face**, with trailers backed in at the bays in the imagery.
- **North building** — a second, older warehouse (white/teal roof) with its own
  trailer rows; counts as a second building on the campus.
- **Trailer drop yards** — a large fan of parked trailers SE of the main
  building, plus rows north of it. The SE yard alone holds dozens of trailers.
- **Employee parking** — large car lot off the NW corner of the building.
- **Pond** — a retention pond sits between the access driveway and the SW
  corner of the building; the driveway loops around it.

## Gate / guard-shack determination
- **truckGate: false.** Street View along Lake Rd (2009, 2019) shows the DC set
  well back behind an open grass field, reached by a **long internal access
  driveway**. There is **no barrier arm and no sliding/swing gate** at the
  public road, and none visible anywhere along the driveway in satellite. Only
  a monument sign marks the road entrance. This is the open-campus archetype
  (Kraft Heinz #3 equivalent — driveway runs from public road to the docks with
  no checkpoint).
- **guardShack: false.** No small staffed booth (1–3-vehicle footprint, windows
  on multiple sides) found at the building, the trailer-yard mouth, or anywhere
  on the driveway. Listed as uncertain only because the highest-zoom (z20)
  imagery here is mid-resolution winter coverage — but no booth-shaped structure
  appears in any view.
- **remoteGs: false** — there is no gate, so remote check-in does not apply.

## Docks & yard
- **dockDoors: 50+** — roughly 60 dock doors estimated across the south and west
  building faces from the rhythm of bays and backed-in trailers. Exact count
  uncertain due to mid-resolution winter imagery.
- **dropArea: 50+** — the SE trailer fan plus the rows north of the building add
  to well over 50 parked trailers; clearly a dedicated drop-yard operation
  (`dropYard: true`).
- **shipRcvSeparate: false** — docks form one continuous L-shaped complex
  (south + west faces), not two physically separate ship/rcv banks.
- **postGateStaging: true** — generous paved interior area between the driveway
  and the dock aprons/drop yards for internal queuing.
- **drivewayLong: true** — the gate-to-dock approach is a long internal driveway
  that easily holds 3+ trucks.
- **scale: false** — no truck scale / weigh pad identified.
- **railServed: false** — no rail spur enters the property.

## Setting
**Rural.** Dayville/Killingly is a small Connecticut town; the DC sits in an
edge-of-town industrial park ringed by woods, fields, a reservoir, and a few
other industrial buildings. Cellular coverage is adequate (industrial park, not
isolated), so `connectivityIssue: false`.

## Web findings
UNFI Dayville is a long-standing, Teamsters-represented food-wholesale DC
serving the New England region — a legacy facility (not one of the new
"fewer, larger, automated" builds). Indeed/Glassdoor list 80+ employee reviews.
The rooftop solar array indicates a sustainability retrofit. No public yard-tech
detail; consistent with the legacy-UNFI east-coast natural/organic footprint
described in the Bushway dossier.

## Final confidence: High
Location unambiguous and address-confirmed. Gate/guard-shack calls are clear
(open campus, no checkpoint). Only the exact dock-door count and the
guard-shack call carry mild residual uncertainty from winter imagery, both
flagged in `uncertainFields`.
