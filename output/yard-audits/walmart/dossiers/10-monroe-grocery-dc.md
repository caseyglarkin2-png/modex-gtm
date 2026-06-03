# Yard Audit Dossier — Walmart Grocery DC 6055, Monroe GA

**Facility:** Walmart Grocery DC 6055 (Grocery / Perishable Distribution Center)
**Address:** 655 Unisia Dr, Monroe, GA 30655 (Walton County)
**Resolved center:** 33.806800, -83.679500
**Map:** https://www.google.com/maps/@33.806800,-83.679500,400m/data=!3m1!1e3
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** High

---

## 1. Location confirmation
The supplied coordinates (33.805985, -83.679061) landed directly on a large
distribution building, confirmed correct (no self-correction needed beyond
re-centering the building centroid to 33.8068, -83.6795). Web search confirms
655 Unisia Dr is Walmart Distribution Center #6055, an ~880,000 sq ft, 24-hour
grocery/perishable DC in Monroe GA, accessed from Hwy 78 via Unisia Dr.
Street View shows a "Walmart DC 6055 — Distribution / Save money. Live better."
monument sign at the entrance, positively identifying the site.

The property sits in an edge-of-town industrial park: separate gray-roof
distribution buildings (other tenants) lie to the NE and E across Unisia Dr;
woods and a pond bound the property on the south and east; a trailer drop yard
and treeline bound it on the west.

## 2. Key views

- **z16 wide / z16b (re-centered) / z17 full:** Two connected buildings — a long
  E-W "north" building and a large square "main" distribution building forming
  an L/T footprint. Extensive parallel rows of parked drop trailers fill the NW
  yard. Employee car parking and the office sit on the E/NE side.
- **z18 west face:** Long line of trailers backed perpendicular into the west
  wall of the main building (a true dock apron) plus dense drop-trailer rows to
  the west.
- **z18 south face:** Trailers backed into the south/SE wall of the main
  building (second dock apron).
- **z18 north building:** Trailers backed into its south face (third dock apron).
- **z18/z20 entrance:** Open divided entrance driveway off Unisia Dr, monument
  sign, no barrier at the road.
- **z18 SE / S:** Woods and a pond — no road access on the south or east; the
  only frontage is Unisia Dr on the NE.

## 3. Gate / guard-shack / dock determinations

**Truck gate — FALSE.** The main (and only) entrance comes off Unisia Dr on the
NE. Street View in three vintages (2018, 2021, 2026-02) shows an open, divided
entrance driveway with the Walmart DC 6055 monument sign and **no barrier arm or
sliding/swing gate across the public-road throat**. Trucks and cars share this
single open entrance (entryExitTogether). The approach is long and deep (~250m+
to the docks), easily holding a 3+ truck queue (drivewayLong), with wide unused
paved apron width (fastLaneOpportunity).
- Best driver's-eye pano: `Ml4i0qBRqr-klyi-Y8TPSA` @ 33.80641,-83.67538,
  heading 285 (sign + drive + building).

**Guard shack — FALSE (low confidence).** No staffed booth resolved at the open
road entrance in any Street View vintage. There **is** a chain-link-fenced
tractor / yard-truck compound inside the property (clearly visible in 2018 SV
looking W/SW from the inner driveway, pano `mK0B_wwrI3uoPH3jFkjb0Q`), implying
some interior access control, but the gate to that compound was not cleanly
imaged. Left guardShack false and remoteGs false (remoteGs requires a true
property-line truckGate, which is absent). Flagged in uncertainFields.

**Docks — 50+.** Dock doors span three building faces:
- Main building **west face**: ~40-50 doors (trailers backed in).
- Main building **south/SE face**: ~30+ doors.
- North building **south face**: ~40+ doors.
Estimated total ~150 doors. Distinct dock banks on different faces suggest
separate shipping/receiving (shipRcvSeparate true, medium confidence).

## 4. Yard zones and counts (yardMetrics)
- **Perimeter:** 9-vertex oriented polygon tracing the treeline/road/pond
  boundary; ~63.3 acres.
- **truckGate zone:** rotated quad over the open entrance throat on Unisia Dr.
- **dropYards (2):** the large NW multi-row drop-trailer yard (primary) and a
  secondary row block along the north building.
- **dockAprons (3):** thin rotated strips hugging the main building's west wall,
  the main building's south/SE wall, and the north building's south wall — each
  one trailer-length deep, long axis parallel to its wall.
- **dockDoorCount:** ~150 (overhead estimate, low precision).
- **trailersVisible:** ~220 across yard + dock faces.
- **trailerParkingCapacity:** ~280.
- **truckGateCount:** 1 (single shared entrance).
- **buildingCount:** 2 (connected north + main buildings).
- **siteAreaAcres:** 63.3 (from perimeter polygon).
- **railServed:** false (no spur into the property).

## 5. Web findings
Walmart DC #6055, 655 Unisia Dr, Monroe GA — ~880,000 sq ft, 24-hour grocery
distribution hub, accessed from Hwy 78. Listed on Choose Walton / Walton County
Chamber as a major Walmart supply-chain facility. Phone (770) 266-4800.

## 6. Final confidence
**High.** Facility unambiguously identified; layout, dock faces, drop yards,
entrance, and perimeter all read clearly from z16-z20 satellite plus multiple
Street View vintages including a fresh 2026-02 pano. Lower-confidence items
(interior fenced-yard gatehouse, exact dock-door count, ship/receive
separation, scale) are flagged in uncertainFields.

---

### Sources
- https://www.waltonchamber.org/members/wal-mart-supply-chain
- https://choosewalton.com/company/walmart/
- https://dcontrol.com/profile/walmart-dc-6055
