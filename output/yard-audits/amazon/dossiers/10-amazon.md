# Deep-Audit Dossier — Amazon EWR4 Fulfillment Center (idx 10)

**Facility:** Amazon EWR4 Fulfillment Center, 50 New Canton Way, Robbinsville, NJ 08691
**Type:** Fulfillment Center (robotics sortable, ~1.2M sq ft)
**Resolved center:** 40.19565, -74.56495
**Confidence:** High
**Method:** deep-audit (satellite probe.ts + Street View + web research)

---

## Step 0 — Facility confirmation

The supplied coordinates (40.195353, -74.566306) landed on the SW corner / employee-parking
edge of the correct building. Satellite probes (z16–z20) around the point show one dominant
large white-roofed warehouse with its long axis running NW→SE, surrounded by Matrix Business
Park. Web search confirmed EWR4 = 50 New Canton Way, ~1.2M sq ft robotics sortable FC in
Matrix Business Park near NJTP exit 7A, serving the NY–NJ–Philadelphia corridor. Street View
at the SW face (40.1928, -74.5632) shows the **"amazon · fulfillment"** building logo,
positively identifying the building.

The long axis runs NW(40.1976, -74.5667) → SE(40.1937, -74.5632), ~526 m long, rotated
≈34° clockwise from north. Building width ≈210 m (consistent with 1.2M sq ft).

---

## Steps 1–3 — Layout, gate, docks

**Orientation of the site.** Two functional faces:
- **SW face** = associate/visitor side. Huge employee parking lots with solar carport canopies,
  the amazon-logo main entrance, a transit bus shelter, stop sign. No truck control here.
  This is the only side Street View can drive.
- **NE face** = truck side. A continuous run of trailers backed into dock doors along the full
  ~500 m NE wall, fronted by a wide concrete apron and a trailer drop court, then a perimeter
  drive and tree buffer screening it from farmland. A retention pond sits off the SE corner.

**Truck gate (truckGate: true).** The truck yard is fenced and access-controlled (fence lines
visible at z20 along the apron; tree-buffer screening; the NW apron tapers to a single painted
drive that exits toward Sharon Rd). Street View cannot enter the truck yard at all — only the
SW employee perimeter and the public rural roads (Sharon Rd, New Canton Way) are driveable,
which is itself confirmation that truck access is gated. Web/driver evidence: drivers present
BOL + appointment at a **security checkpoint** and report 30+ minute waits before unloading;
a contracted **Command Security "Amazon - Robbinsville - EWR4"** guard post exists.

**Guard shack (guardShack: true — medium confidence on structure).** A manned booth at the
truck gate is consistent with the Command Security post and is standard for a 1.2M sq ft Amazon
FC with the reported manned-checkpoint queues. The booth structure could not be individually
resolved in satellite because the gate sits deep inside the yard behind the tree buffer; the
call rests on the guard-post + checkpoint evidence rather than a directly imaged booth, so
guardShack is flagged in uncertainFields. remoteGs is false (a guard post is staffed).

**Docks (dockDoors: 50+).** Trailers are backed in along essentially the entire NE wall
(nedock2_z20, nw_courtend_z20, truckyard_se_z18, se_yardentry_z20). A single dock bank on one
building face → shipRcvSeparate: false. 50+ is conservative for this footprint.

**Drop yard (dropYard: true, dropArea: 25-50).** A deep truck court NE of the dock apron holds
many parked trailers without tractors — a dedicated drop/marshaling lot wrapping from the NW
end around to the SE corner.

**Queuing / approach (drivewayLong: true, postGateStaging: true, backupSensitive: true,
fastLaneOpportunity: true).** Long internal approach with room to stack trucks inside; reported
30+ min checkpoint queues make intake backup-sensitive. The large apron/court has ample paved
width to add an express/marshaling bypass lane. entryExitTogether: true (single gated truck
intake area); entryLanes≈2 / exitLanes≈1 estimated (exact lane striping not visible).

**Not present:** no truck scale/weigh pad (scale: false), no rail spur (railServed: false),
no second checkpoint stage imaged (multiStep: false). multipleFacilities: false — single EWR4
building; the adjacent large warehouses (including a heavily solar-roofed building to the south)
are separate Matrix Business Park parcels.

**urbanRural: Rural.** Matrix Business Park sits at the edge of Robbinsville Twp, bordered by
active farmland and a tree nursery to the N/NE. Edge-of-town industrial → Rural per rubric.
connectivityIssue: false (large metro-corridor business park, coverage fine).

---

## Geofences & yard metrics

- **perimeter** — 4-vertex oriented ring tracing the fenced parcel (Sharon Rd on NW, dock-court
  /farm buffer on NE, pond on SE, employee-lot edge on SW). ≈ **67.8 acres**.
- **dockApron** — long thin oriented quad hugging the NE dock wall at the building's ~34° angle.
- **dropYard** — oriented quad over the NE trailer drop court, parallel to the dock wall.
- **truckGate** — quad over the NW pinch-point exit drive to Sharon Rd.
- **staging** — post-gate court area near the NW yard end.

| Metric | Value |
|---|---|
| dockDoorCount | ~60 |
| trailersVisible | ~55 |
| trailerParkingCapacity | ~45 |
| truckGateCount | 1 |
| buildingCount | 1 |
| siteAreaAcres | 67.8 |
| railServed | false |

**streetViewMeta:** all four traced zones returned `status: OK`. truckGate uses pano
`vnQDj8UiC2RjN389B_x46g` (Sharon Rd, 2023-09, heading 209° toward the NW gate) — the closest
public road-level arrival frame, though the gate itself is screened by trees. perimeter, dockApron
and dropYard panos sit on the SW employee road / Sharon Rd, aimed toward each zone.

---

## Web findings

- EWR4 = ~1.2M sq ft Amazon Robotics sortable FC, 50 New Canton Way, Matrix Business Park,
  Robbinsville NJ; serves NY/NJ/Philadelphia corridor (LTL/TL linehaul + parcel).
- Drivers check in with BOL/appointment at a security checkpoint; reported 30+ min waits;
  drivers' lounge on site. Command Security staffs the EWR4 guard post.

Sources: flexfulfillment.eu EWR1/EWR4 page; Indeed/ZipRecruiter (Command Security EWR4 guard
post); amazontours / factorytoursguide EWR4 pages; Waze listing.

---

## Final confidence: HIGH

Building positively identified by amazon logo in Street View + address + footprint. Gate, dock,
and drop-yard determinations rest on direct satellite evidence plus corroborating driver/guard
reports. Only the physical guard-shack structure (vs. resolved booth image) and exact gate lane
counts are medium-confidence, flagged in uncertainFields.
