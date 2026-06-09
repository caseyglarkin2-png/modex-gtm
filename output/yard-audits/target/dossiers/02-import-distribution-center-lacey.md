# Deep-Audit Dossier — Target Import Distribution Center, Lacey WA

- **Facility:** Target Import Distribution Center Lacey
- **Type:** Import Warehouse (Target's single largest import DC, ~1,700,000 sq ft)
- **Address:** 3500 Marvin Rd NE, Lacey, WA 98516
- **Geocoded coords (given):** 47.08229, -122.771529
- **Resolved center (this audit):** **47.08185, -122.77385**
- **Method:** deep-audit (satellite z15-z21 + Street View + web)
- **Confidence:** medium

---

## 1. Location confirmation

The supplied geocode landed on the roof of the correct building (a single very large
warehouse in the Hawks Prairie / Lacey Gateway industrial park), but the point was
east-of-center because the building is enormous. Web research confirms the identity:

- CLUI and multiple sources describe the Lacey facility as Target's **west-coast import
  warehouse, 1,700,000 sq ft — "by far the biggest" of Target's import warehouses.**
- Target careers postings list import-DC operations roles at **3500 Marvin Rd NE, Lacey WA 98516**.

Wide z15 imagery shows a multi-warehouse business park; the Target building is the
central one whose roof spans nearly 600 m E-W, with a continuous dock face and a deep
trailer drop yard on its **south** side. Footprint/scale (~600 m x ~110 m roof plus a
~600 m drop yard) is consistent with the 1.7M sq ft figure. I re-centered the audit on
the true building center.

Neighboring large warehouses to the N, S and E are **separate** properties in the same
park and were excluded.

## 2. Key views

| View | File | What it showed |
|---|---|---|
| Overview z17 | overview-z17.png | Building roof, south dock row, drop yard full of trailers |
| Wide z15 | wide-z15.png / site-wide-z15.png | Multi-warehouse park; Target building isolated as the central one |
| Center z16 | center-z16.png / measure-z16.png | Whole facility: N office/parking, S dock + drop yard, W roundabout |
| South dock z18 | south-dock-z18.png, south-entrance-z17.png | Continuous dock doors with trailers backed in across full south wall |
| Drop yard z19-z20 | sw-gate-z19, se-yard-entry-z19, s-yard-mid-z19 | Dozens of trailers in marked drop stalls, no tractors |
| SW / W perimeter z19 | prop-sw-z19, prop-w-z19, driveway-road-z18 | Perimeter drive loops the yard; S/W bounded by woods, no public access |
| West wrap pinch z20-z21 | west-wrap-z20, wrap-pinch-z21 | "No Truck Traffic" pavement stencil; yellow object = yard equipment, not a booth |
| Street View | sv-north-entry-s, sv-nw-entry-e, sv-roundabout-e | Building walls / perimeter roads set back behind wooded buffers |

## 3. Gate / guard-shack / dock determinations

- **truckGate = true (medium confidence).** The property is a fully enclosed private
  campus. The south truck/drop yard is reached through a single wrap-around pinch point
  at the building's **west end** (north campus drive -> around the west wall -> south
  yard). Everywhere else the property is hemmed by the building (north) and wooded /
  landscaped buffers and retention ponds (south, east) with no public through-access.
  A barrier arm could not be positively resolved in overhead imagery, but a bonded
  import DC of this importance operates controlled truck entry; called true and flagged
  uncertain.
- **guardShack = false.** No small staffed-booth structure (1-3-stall footprint, windows
  on several sides) was identifiable at any entry pinch point across z19-z21 imagery. The
  only small object near the SW entry is yard equipment (a yellow dock ramp / container
  handler parked against the dock wall).
- **remoteGs = true.** Gate present, no visible guard shack -> implies kiosk / call-box /
  app check-in.
- **dockDoors = 50+.** A continuous run of dock doors spans the entire ~600 m south wall
  with colored trailers backed in along its full length (south-dock-z18, se-yard-entry-z19,
  east-conn-z18). Estimate ~130 doors.
- **dropArea / dropYard = 50+ / true.** The south yard holds dozens of parked trailers in
  marked drop stalls with no tractors, in multiple long rows.

## 4. Yard zones & counts

- **perimeter** — oriented ring tracing the building footprint (north) plus the south drop
  yard out to the perimeter drive; ~62 acres.
- **truckGate** — quad over the west wrap-around pinch point.
- **dropYards** — one ring over the south trailer drop field.
- **dockAprons** — one long thin ring hugging the south dock wall.
- **yardMetrics:** dockDoorCount ~130, trailersVisible ~120, trailerParkingCapacity ~200,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~62, railServed false (no spur into the lot).

## 5. Web findings

- 1,700,000 sq ft; Target's largest import warehouse; west-coast import DC near Olympia.
- Operating hours commonly listed 8:00-17:00 Mon-Fri; phone (360) 486-7000 / 486-7100.
- Sits in the Hawks Prairie / Lacey Gateway industrial park (edge of Lacey, near I-5).

Sources: CLUI (clui.org/ludb/site/target-distribution-center-lacey), Target corporate
careers (corporate.target.com / target.wd5.myworkdayjobs.com), Lacey Chamber listing,
TruckMap, MWPVL Target DC network.

## 6. Final confidence

**Medium.** Building identity, dock band, drop-yard band, scale and rural setting are
high-confidence from clear imagery. The gate/guard-shack hardware sits at an internal
wrap-around pinch point set back from Street-View-covered roads, so truckGate / guardShack
/ remoteGs are reasoned calls flagged as uncertain.
