# Deep-Audit Dossier — John Deere Dubuque Works, Dubuque IA (idx 9)

## Resolved location
- **Address:** 18600 S John Deere Rd, Dubuque, IA 52001
- **Locked center:** 42.566837, -90.690881 (centroid of the mile-long main
  building)
- **Confirmation:** Roster geocode flagged `movedMeters: 14294`, so the supplied
  point was verified independently. Satellite z14-16 around the supplied
  coordinate shows one enormous mile-long industrial complex on a riverbottom
  tract SW of Dubuque — exactly the John Deere Dubuque Works. Web search
  (about.deere.com Dubuque Works, Iowa DNR Facility Explorer, Panjiva) confirms
  the plant: a Construction & Forestry facility making backhoes, crawler dozers,
  and skid-steer loaders, in operation since 1946, "in excess of one mile long
  on 1,465 acres." The supplied coordinate is in fact correct and on the
  building — locked as the center.

## Key views
- **Very wide (z14):** Single immense plant on a narrow riverbottom strip
  between farmland/woods (west) and a Mississippi River backwater (east).
- **Main complex (z16):** Mile-long contiguous building with multiple roof
  sections; riverside yards, material laydown, and trailer storage.
- **Riverside drop yard (z19-20):** Dozens of trailers parked in long rows
  along the east side of the plant.
- **East edge (z18-20):** A rail spur runs the full length of the property
  along the riverside, past wastewater ponds — rail service confirmed.
- **South/east building edge:** Finished construction equipment (motor graders,
  loaders, in Deere yellow) staged on paved marshaling aprons.
- **Entry (z17-18 + Street View 2025):** Long internal access road off S John
  Deere Rd with multiple roundabouts crossing open Deere land; no booth visible
  from public Street View, which stops at the property edge.

## Gate / guard-shack / dock determinations
- **truckGate: true (inferred, medium confidence)** — A mile-long, 1,465-acre
  secured industrial campus reached only by a long internal access road with
  managed roundabouts. Controlled truck entries at the building edge are
  inferred from the campus scale and layout; specific gate hardware could not
  be resolved (no Street View past the property edge).
- **guardShack: false** — No guard booth resolved at entries in satellite
  imagery.
- **remoteGs: true (low confidence)** — Set as the corollary of an inferred
  gate with no resolved booth.
- **Docks:** ~30 truck dock positions estimated across the mile-long east
  building face, banded **25-50**. Finished construction equipment also ships
  drive-away and on rail, so dock count understates total throughput.
- **railServed: true** — A rail spur runs the entire east edge of the property.

## Yard zones and counts
- **Perimeter:** ~480-acre developed/fenced industrial footprint (full Deere
  tract is 1,465 acres including buffer land).
- **truckGate:** Boxed on the access-road corridor approaching the building.
- **dropYards:** Two — the large riverside trailer yard (50+ trailers) and a
  southern material/finished-equipment marshaling yard.
- **dockAprons:** One — the east-face loading strip.
- **staging:** Large interior paved holding area between the building and yards.
- **yardMetrics:** ~30 dock doors, ~55 trailers visible, ~120 trailer capacity,
  2 truck gates, 6 buildings, ~480 developed acres, rail-served.

## Web findings
- about.deere.com confirms Dubuque Works (Construction & Forestry), products
  include backhoe loaders, crawler dozers, and skid-steers; operating since 1946;
  plant exceeds one mile in length on 1,465 acres.
- Iowa DNR Facility Explorer and Panjiva corroborate the 18600 S John Deere Rd
  address and active import/freight activity.

## Final confidence
**Medium.** Location, scale, rail service, and the large trailer drop yard are
unambiguous. Confidence is held at medium because truck-gate / guard-shack calls
are inferred from campus geometry (no Street View on the internal road), the
mile-long building makes exact dock-door counts impossible from overhead
imagery, and finished construction equipment ships partly drive-away / on rail.
