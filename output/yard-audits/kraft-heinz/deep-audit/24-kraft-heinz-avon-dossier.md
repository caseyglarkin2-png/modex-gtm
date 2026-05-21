# Deep-Audit Dossier — Kraft Heinz, Avon NY

**Facility:** Kraft Heinz - Avon
**Address (web-confirmed):** 140 Spring Street, Avon, NY 14414 (Livingston County)
**Approx. coordinates:** 42.9050843, -77.755732
**Method:** Tier-2 deep audit — satellite (z15–z21) + Street View (panos captured Aug 2025) + web research
**Date of audit:** 2026-05-17

---

## Site overview

Large single-building food-manufacturing plant — USDA/FSIS lists it under "Fruit and Vegetable
Preserving and Specialty Food Manufacturing." ~405 employees; largest private employer in the
county. This is a production plant, not a pure DC. The plant occupies the center of the parcel
with process equipment (silos/tanks) on the north/process side, an employee parking lot and
office wing on the east side, and a large operational truck yard with trailer storage on the
southwest side.

The parcel is bounded by public roads: a NW–SE road along the west/southwest frontage
(the truck-entrance road) and a separate road along the east frontage (employee/car side).

---

## Entrance identification

The **truck entrance** is a single wide paved driveway where the SW truck yard meets the
NW–SE public road, at approximately **42.9047, -77.7587**.

Probed satellite at z19–z21 (`/tmp/kh_swcorner.png`, `/tmp/kh_drvwy2.png`,
`/tmp/kh_junction.png`): the driveway is a broad gravel/asphalt apron — wide enough for two
trucks to pass — running straight from the road into the open yard. No choke point, no
structure flanking it.

The east-side road frontage (`/tmp/kh_eside.png`) is the employee/car side: a parking lot
behind a low chain-link fence. Not a truck entrance. NW frontage (`/tmp/kh_nwroad.png`) and
SW frontage (`/tmp/kh_swroad.png`) are open lawn / wooded buffer — no additional truck gates.
Single truck entrance confirmed.

---

## Street View evidence (pano @ 42.904876, -77.758819, captured Aug 2025)

Looked squarely at the entrance from multiple headings:

- **Heading 135° (`/tmp/sv_e1.png`):** Wide, fully open paved driveway leading straight into
  the truck yard. No barrier arm. No swing/slide gate. No guard booth. A small white
  freestanding sign on a post sits on the left of the driveway near the road.
- **Heading 110° (`/tmp/sv_e4.png`) and 90° (`/tmp/sv_e2.png`):** Full frontage view — open
  curb-cut apron onto the public road, plant building and trailers visible behind. No
  perimeter fence crossing the driveway, no gate, no booth.
- **Heading 120° (`/tmp/sv_sign.png`):** Confirms the roadside object is a passive
  freestanding directional/wayfinding sign (truck-routing/office sign), NOT a check-in
  kiosk or call box positioned on the truck lane.
- **In-yard satellite (`/tmp/kh_yardin.png`, z20):** The truck yard interior is a vast open
  paved area with trailers and building docks. No small kiosk-footprint structure (guard
  booth) anywhere along the driveway or in the yard.

---

## Gate / guard determinations

**truckGate — FALSE.** The truck driveway is a completely open curb-cut onto the public road.
No barrier arm, no sliding or swing gate, and no perimeter fencing crossing the lane. Multiple
Street View headings (90°, 110°, 120°, 135°) and satellite z20–z21 all show an uncontrolled,
wide-open entrance. High confidence.

**guardShack — FALSE.** No guard booth or shack of any kind at the entrance or set back along
the driveway. No small 1–3-vehicle-footprint structure with windows visible in Street View or
in z20/z21 satellite of the yard. High confidence.

**remoteGs — FALSE.** The only roadside object is a passive freestanding wayfinding sign — not
an intercom/call box or self-service check-in kiosk on the truck lane. There is no evidence of
a remote/virtual gate-management setup. High confidence.

The entrance is functionally an open industrial driveway. Access control, if any, happens
inside the building at a shipping office — there is no physical gate, booth, or kiosk at the
property line.

---

## Other classification notes

- **drivewayLong — TRUE.** The driveway/yard runs ~150 m+ from the public road to the building
  docks; trucks have substantial run-in before reaching dock doors.
- **postGateStaging — TRUE.** Large open paved yard inside the property serves as staging;
  trailers parked across the yard. **preGateStaging — FALSE** (no marshalling area outside the
  property line; entrance opens directly off the road).
- **entryExitTogether — TRUE; entryLanes 1 / exitLanes 1.** Single shared driveway for both
  in and out; no separation, no markings dividing entry/exit. **fastLaneOpportunity — FALSE.**
- **dockDoors — "25-50".** Dock doors visible along multiple faces of the building in the
  truck yard (`/tmp/kh_sw.png`, `/tmp/kh_swcorner.png`); numerous trailers spotted at docks.
- **dropArea — "10-25".** Dedicated trailer drop/storage rows present along the west edge and
  in the yard (e.g. `/tmp/kh_junction.png` shows a parked trailer row).
- **shipRcvSeparate — FALSE.** Ship/receive appear consolidated in the one SW truck yard; no
  separate receiving gate or yard observed.
- **urbanRural — "Urban".** Located within the village of Avon; residential streets and houses
  immediately adjacent on the north and east (`/tmp/kh_nw.png`, `/tmp/kh_z16.png`).
- **dropYard — FALSE.** Active production plant with docks, not a standalone drop yard.
- **scale — FALSE.** No truck scale identified at the entrance or in the yard.
- **multipleFacilities / multiStep — FALSE.** Single plant, single entrance process.
- **connectivityIssue — FALSE.** Open village setting, no terrain/coverage concerns.
- **backupSensitive — FALSE.** Yard is wide and open, ample maneuvering room.

---

## Web research findings

- 140 Spring Street, Avon, NY 14414. Kraft Heinz Foods Company; USDA/FSIS-inspected
  establishment. Industry: Fruit & Vegetable Preserving / Specialty Food Manufacturing.
- ~405 employees — largest private-sector employer in Livingston County.
- Part of the 2015 Kraft-Heinz / New York State agreement (with Walton and Lowville plants)
  that kept the upstate facilities open; up to ~$20M invested over five years.
- No public reporting of a manned security gate; consistent with the open-driveway imagery.

Sources:
- https://www.fsis.usda.gov/inspection/fsis-inspected-establishments/kraft-heinz-foods-company-1
- https://business.livingstoncountychamber.com/list/member/kraftheinz-avon-5761
- https://agriculture.ny.gov/news/governor-cuomo-and-senator-schumer-announce-agreement-between-kraft-heinz-and-upstate-niagara

---

## Final confidence: HIGH

Recent (Aug 2025) Street View from four headings directly at the entrance, plus z20–z21
satellite of the driveway and yard, all consistently show an open, uncontrolled truck
driveway with no gate, no guard shack, and no remote check-in kiosk. All 22 classification
fields resolved; no uncertain fields.
