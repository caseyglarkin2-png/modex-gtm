# Deep-Audit Dossier — Glovis America Vehicle Processing Center, West Point GA

**Roster idx:** 11
**Account:** Hyundai Motor America
**Facility type:** Vehicle Processing Center (finished-vehicle)
**Address:** 2000 Webb Rd, West Point, GA 31833
**Locked center:** 32.913000, -85.131500
**Method:** deep-audit · **Confidence:** medium

## Step 0 — Location confirmation
The roster coordinate (32.911036, -85.137392 / 2000 Webb Rd) lands at the
southwest tip of the Kia Georgia (KaGA) automotive campus. A z20 satellite probe
at that exact point shows only an open paved parking-lot apron off Webb Rd — not
a building. Web research (glovisusa.com locations; CMac.ws / YellowPages
directory listings; Automotive Logistics feature) confirms Glovis America
operates a Vehicle Processing Center co-located on the KaGA campus where Kia
opened its assembly plant in late 2009. Glovis is Hyundai Motor Group's captive
finished-vehicle 3PL. The auditable "facility" is the VPC vehicle-marshaling and
processing operation on the campus — not the empty roster pixel — so the center
was locked on the core vehicle-storage lots at 32.9130, -85.1315.

## Key views
- **z14 full campus** — the Kia assembly plant (white-roof building cluster) sits
  upper-center; vast bluish vehicle-storage lots full of finished cars dominate
  the south and west — the Glovis VPC marshaling yard. Campus is surrounded by
  forest with an I-85 interchange on the east.
- **z18 core / z19 carrier probes** — densely packed finished vehicles in marked
  rows across hundreds of acres of paved lots. No box-trailer drop yard, no dock
  banks; this is a finished-vehicle marshaling layout.
- **z18 rail probe** — multiple parallel auto-rack rail spurs run directly into
  the vehicle yards on the northwest side, with a small rail-side processing
  building. Confirms rail-served receiving/shipping.
- **z19 gate2 probe** — internal campus roads, employee parking, and a small
  checkpoint-style structure on an interior artery.
- **Street View** — only one public pano on Webb Rd (2023-07) at the SW employee
  apron; campus interior has no Street View (private/secured). A 2024-11 pano on
  the wide eastern access road shows a multi-lane approach into the campus.

## Gate / guard-shack / dock determinations
- **Truck gate:** TRUE (medium confidence). The KaGA/Glovis campus is a secured
  private property with controlled vehicular access. Car-carrier (auto-hauler)
  trucks enter through a controlled campus gate. No public Street View inside the
  fence prevents a definitive booth-vs-kiosk read.
- **Guard shack:** FALSE / **remoteGs:** TRUE (best estimate, flagged uncertain).
  Could not positively confirm a staffed multi-window booth at the car-carrier
  gate; small internal structures exist but identity is ambiguous.
- **Dock doors:** NONE. A finished-vehicle VPC has no traditional loading docks —
  vehicles move by car-carrier truck and by rail. `dockDoorCount` = 0 reflects
  the facility type, not a missed count.

## Yard zones and counts
- **Perimeter:** ~385 acres covering the VPC vehicle-storage yards and rail
  facility (SW 32.9078,-85.1385 → NE 32.9185,-85.1245). The full KaGA campus
  including the assembly plant is far larger.
- **Drop yards:** two large vehicle-marshaling blocks — the southern lots and the
  west/rail-adjacent lots — each holding many thousands of finished vehicles.
- **Staging:** paved apron near the Webb Rd entrance.
- **dropArea band:** 50+ (tens of thousands of vehicle stalls).
- **Buildings:** ~6 distinct processing/PDI structures plus the assembly plant
  cluster — multiple-facilities campus.
- **Rail-served:** TRUE — multiple auto-rack spurs into the yard.

## Web findings
- glovisusa.com lists West Point among Glovis America locations; Glovis Georgia
  LLC is the operating entity.
- Automotive Logistics confirms Glovis runs a vehicle processing centre at the
  Kia West Point plant.
- Directory listings place Glovis America at 2000 Webb Rd, West Point, GA 31833.

## Final confidence
**Medium.** Facility type, rail service, vast vehicle-marshaling layout, rural
setting, and multi-building campus are all clearly read from imagery. Gate
control specifics (staffed booth vs kiosk, exact lane counts, presence of a
scale) could not be positively confirmed because the campus interior is private
with no Street View — these fields are listed as uncertain.
