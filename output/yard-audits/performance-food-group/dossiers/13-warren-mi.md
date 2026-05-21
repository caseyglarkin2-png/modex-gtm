# Deep-Audit Dossier — Performance Foodservice, Detroit / Warren MI (idx 13)

**Facility:** Performance Foodservice - Detroit (Warren MI)
**Type:** Broadline Foodservice Distribution Center
**Address:** 24838 Ryan Road, Warren, MI 48091
**Resolved center:** 42.474855, -83.063823
**Confidence:** High

## Location resolution
The roster coordinate (ROOFTOP geocode, 104 m move) landed on a large
two-section distribution building fronting Ryan Road in Warren, MI (suburban
Detroit). Web search confirmed 24838 Ryan Road, Warren, MI 48091 as Performance
Foodservice - Detroit, operated by Reinhart Foodservice, L.L.C. (PFG location
page, Waze, Manta, Blue Book, BuzzFile). The Reinhart lineage matches the
dossier (PFG acquired Reinhart in 2019). Location positively confirmed.

## Key views
- **Wide satellite (z16):** an urban industrial parcel surrounded by single-family
  residential housing on the east and south, a strip-retail center to the north,
  and other small industrial uses across Ryan Rd to the west. Distinctly urban
  Detroit fabric.
- **Tight satellite (z17-z21):** two physically connected building sections. The
  truck yard on the north and east holds dock doors with trailers backed in, a
  bank of drop trailers in the NW, and a fleet of tractors parked in the NE. A
  chain-link perimeter fence rings the yard.
- **Street View — Ryan Rd front (2025-03):** the building's office/visitor face
  with employee parking and an open visitor driveway — no barrier arm here.
- **Street View — north property line (2022-10):** looking south across the yard,
  a chain-link fence runs the property edge with trailers and the dock face
  behind it.
- **Street View — NE / north service drive (2019, 2025):** the truck-yard
  entrance — a wide concrete drive into the fenced yard. No guard booth visible.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The truck yard (docks + drop/fleet parking) is enclosed
  by a chain-link perimeter fence and entered through a controlled gate off the
  north-side service drive. The front office entrance on Ryan Rd is a separate
  open visitor driveway.
- **guardShack = false / remoteGs = true (both uncertain).** No guard booth is
  visible at the truck gate in any imagery vintage (2018/2019/2022/2025 Street
  View, current satellite). A fenced gated yard with no visible booth is
  classified as remote check-in (kiosk / intercom). Both flagged uncertain — this
  is an older urban Reinhart-era DC and a small booth could be tree-obscured.
- **dockDoors = "25-50".** Dock faces run along the north building face and the
  east side, with trailers backed in across multiple faces.
- **dropArea = "10-25" / dropYard = true.** A bank of drop trailers occupies the
  NW of the yard; a tractor/fleet parking strip sits to the NE.
- **drivewayShort = true.** Tight urban site — short gate-to-dock approach, 1-2
  trucks of stacking room, no deep internal queue lane.
- **backupSensitive = true.** Constrained parcel hemmed by Ryan Rd and abutting
  residential housing — a gate queue would quickly spill onto the local street.
- **scale = false.** No truck scale visible.
- **railServed = false.** No rail spur enters the property.

## Yard zones & counts
- Perimeter geofence captures the full parcel, ~14.5 acres.
- Drop yard: NW of the yard, ~45-trailer capacity including fleet parking;
  ~28 trailers/tractors visible in imagery.
- Dock apron: north building face and east side.
- Two connected building sections counted as one facility (multipleFacilities
  false).

## Web findings
Performance Foodservice - Detroit operates at 24838 Ryan Road, Warren, MI 48091
(phone 586-757-9998 / 888-637-0010), under Reinhart Foodservice, L.L.C. — i.e. a
former Reinhart broadline DC folded into PFG's Performance Foodservice segment
after the 2019 Reinhart acquisition. It is an established, fully operational
urban DC serving the metro Detroit foodservice market.

## Final confidence: High
Location positively confirmed; imagery is clear and multi-vintage (Street View
2018-2025, current satellite). The urban setting, two-building layout, fenced
truck yard, and dock/drop pattern are all unambiguous. Only the guard-shack /
remote-check-in determination and exact dock count are flagged uncertain.
