# Deep-Audit Dossier — GXO Logistics Distribution Center, Bethlehem PA

**Roster idx:** 10
**Account:** GXO Logistics (`gxo`)
**Facility:** GXO Logistics Distribution Center - Bethlehem PA
**Type:** Distribution Center
**Address:** 3633 Commerce Center Blvd, Bethlehem, PA 18015
**Locked coordinates:** 40.61090, -75.31565 (building centroid)
**Method:** deep-audit · **Final confidence:** high

---

## Step 0 — Location confirmation

The roster supplied ROOFTOP-precision coordinates (40.609939, -75.315452). A
satellite probe at those coordinates landed directly on the roof of a very
large industrial building inside the **Majestic Bethlehem Center** — a
441-acre master-planned business park at the I-78 / PA-412 interchange in
Bethlehem, Lehigh County, PA.

Web research confirmed the facility: **3633 Commerce Center Blvd is a
1,041,600 sq ft distribution building, built 2022, on a ~45.04-acre parcel**,
leased to **Nike for East-Coast e-commerce fulfillment and operated by GXO
Logistics**. The address numbering along Commerce Center Blvd runs 3051
(Building 1B) at one end to 3905 (Building 6) at the other; 3633 sits mid-range
and the ROOFTOP geocode lands squarely on a ~1M sq ft building consistent with
that size — the correct building. The roster coordinates fall on the building's
south third; I locked the center on the building centroid (40.61090,
-75.31565).

Note: Google Street View for Commerce Center Blvd is from July 2019, before
this building was constructed (the panos show an empty graded lot). All
gate/dock/yard determinations therefore rely on current (2026 Maxar) satellite
imagery.

---

## Key views

- **Wide / context (z15-z16):** Confirmed the target as one large building in a
  row of several giant DCs in Majestic Bethlehem Center. The building runs
  NW-SE. Commerce Center Blvd runs along the south.
- **Building footprint (corner probes z19):** NW ~40.61285,-75.31755 ·
  NE ~40.61210,-75.31390 · SW ~40.60945,-75.31650 · SE ~40.60925,-75.31460.
  Bounding the property (incl. dock courts and parking) gives ~44 acres,
  matching the 45.04-acre parcel of record.
- **South face:** Office / employee entrance side — building portico plus
  extensive employee car parking; no truck docks.
- **NE long face:** Dock face — tan concrete dock apron with trailers backed in
  along a shared truck court between the target and the building to its NE.
- **SW long face:** Dock face — dock doors with trailers backed in along a
  shared truck court between the target and the building to its SW. Striped
  trailer stalls painted "DROP POINT 7" / "DROP POINT 10".

---

## Gate / guard-shack determination

**Truck gate — TRUE.** At the SW corner of the building (~40.6090, -75.3168), a
controlled truck entrance leads into the SW dock court. The z20-z21 probes show
the truck driveway pinching down through a structure with channeled lanes — a
separate down-arrow lane to the left of the structure and a truck lane passing
the structure. Landscaped islands flank the lanes. A truck with a blue trailer
is stopped at the structure in the current imagery — the active check-in
position.

**Guard shack — TRUE.** The structure in the gate lane is a built
flat-roofed gatehouse / canopy booth, roughly a 2-3 vehicle footprint, set in
the truck-lane median exactly where a guard checkpoint would sit. The truck
queued at it confirms a staffed check-in point. This is a physical guard
structure, not a kiosk.

**Remote GS — FALSE** (a physical guard structure is present).

**Backup-sensitive — FALSE.** The gate is set well inside the property, off
Commerce Center Blvd, with a paved internal area and the large dock court for
stacking; a truck queue would not spill onto the public road.

**Multi-step — FALSE.** A single gate point; no second checkpoint or scale
house observed in the truck path.

---

## Dock / yard determination

- **Dock doors — "50+".** A ~1,041,600 sq ft cross-dock DC with dock doors
  along **both long faces** (NE and SW). z19 count strips show a long, regular
  dock-door rhythm with trailers backed in. Estimated ~150 total doors —
  unambiguously in the "50+" band.
- **Ship/receive separate — TRUE.** Two physically distinct dock banks on
  different building faces (NE and SW long faces) facing separate truck courts.
- **Drop area / drop yard — "50+", dropYard TRUE.** Both dock courts carry
  numerous striped trailer stalls explicitly labelled "DROP POINT 7" and
  "DROP POINT 10"; this is a drop-trailer-heavy operation with well over 50
  designated drop positions.
- **Staging:** preGateStaging TRUE (paved internal area south of the gatehouse,
  mixed with circulation — medium confidence); postGateStaging TRUE (the deep
  dock courts and DROP POINT stalls give ample holding room inside the gate
  before the dock doors).
- **Driveway — long.** Gate-to-dock approach runs the length of the dock
  courts; easily holds 3+ trucks.
- **Rail — FALSE.** No rail spur enters the property; truck-served only.

### Yard zones & counts (estimates from overhead imagery)
- `dockDoorCount` ≈ 150 (both faces; approximate)
- `trailersVisible` ≈ 110 (backed in at docks + parked in stalls across all
  courts in captured imagery)
- `trailerParkingCapacity` ≈ 220 (striped stalls + dock positions; approximate)
- `truckGateCount` = 1 (single controlled gate at SW corner)
- `buildingCount` = 1 (single building on this parcel; other Majestic Bethlehem
  Center buildings are separate facilities/parcels)
- `siteAreaAcres` ≈ 44.0 (derived from perimeter box; parcel of record 45.04)
- `railServed` = false

---

## Web findings

- 3633 Commerce Center Blvd — 1,041,600 sq ft, built 2022, 45.04-acre parcel,
  HI industrial zoning, in Majestic Bethlehem Center.
- Leased to Nike for East-Coast e-commerce fulfillment; operated by GXO
  Logistics. Climate-controlled, automated DC; ~250+ jobs.
- Direct access to I-78, close to NYC and Philadelphia metros.
- (Sources: GXO jobs site, Lehigh Valley Chamber, Showcase.com, SGB Media,
  Majestic Realty Co.)

---

## Confidence

**High.** The facility is positively identified, the 2026 satellite imagery is
clear and high-resolution, and the gate / guard-shack / dock calls are well
evidenced. Lower-confidence items flagged in `uncertainFields`: exact
entry/exit lane counts at the gate, the pre-gate staging classification, and
the approximate dock-door and trailer-capacity counts (honest estimates from
overhead imagery, not exact figures). Street View could not corroborate the
gate because the only panos predate the building's 2022 construction.
