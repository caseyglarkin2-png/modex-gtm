# Yard Audit Dossier — Walmart Import DC 6060, Eastvale CA

**Facility:** Walmart Import Distribution Center 6060 (IDC 6060)
**Type:** Import DC (LA/Long Beach port-fed; formerly addressed Mira Loma)
**Address:** 4250 Hamner Ave, Eastvale CA 91752 (physical frontage: Harvest Dr)
**Resolved center / NW building corner:** 34.0103834, -117.5576745
**Method:** deep satellite (z14–z20) + Street View
**Confidence:** high (gate/fence high; guard-shack type medium)

---

## 1. Location confirmation

The supplied coordinates (34.010383, -117.557675) landed precisely on the
**NW corner of a large white-roofed warehouse** inside the Goodman / Prologis
Commerce Center, the dense logistics park west of I-15 between Cantu-Galleano
Ranch Rd and Bellegrave Ave in Eastvale.

I confirmed the building three ways:
- **Geocode:** "4250 Hamner Ave, Eastvale CA 91752" returns a **ROOFTOP** match
  at 34.0103834, -117.5576745 with the navigation point on the west frontage
  road — i.e. the exact NW corner of this building.
- **Reverse geocode** of the west frontage road returns **"4250 Harvest Dr"** —
  the building physically fronts Harvest Drive; "Hamner Ave" is the mailing
  address. (A Waze listing for this DC also uses a Harvest Dr address.)
- **Web research** confirms IDC 6060 at this address, a ~10,000-employee import
  DC opened ~2019, sitting in the Goodman/Prologis Commerce Center campus.

The building is a long **E-W cross-dock**: office + employee parking on the
west (Harvest Dr) face, loading docks on both the north and south faces, with
packed trailer courts between buildings and a dedicated drop yard to the north.

## 2. Key views

- **z14/z16 context** — confirmed the industrial park, I-15 to the east,
  Harvest Dr the internal N-S spine, multiple near-identical mega-warehouses.
- **z18 north court (34.011, -117.5545)** — a shared E-W truck court packed with
  trailers backed into docks on BOTH faces: classic cross-dock import operation.
- **z19/z20 SW & NW corners** — south dock face with trailers backed in, open
  concrete dock court, employee parking and a landscaped driveway entrance off
  Harvest Dr. Office annex on the building's west end.
- **z18 north (34.0128, -117.5520)** — dense dedicated trailer **drop yard**
  north of the complex (hundreds of stored trailers).

## 3. Gate / guard / dock determinations

- **truckGate = true.** Street View along the east (I-15) perimeter shows a
  **continuous steel security fence with sliding-gate sections** and concrete
  K-rail; a "PROLOGIS"-branded building face sits behind it. The yard is fenced
  and access-controlled. Truck/yard entry is the Harvest Dr driveway into the
  secured dock court.
- **guardShack = false / remoteGs = true.** No staffed guard booth resolved at
  the entrance in either satellite or Street View. Modern Prologis/Goodman spec
  DCs of this type typically use kiosk/intercom check-in, so the gate is
  classified as remote-guard. This is the lowest-confidence call (flagged).
- **dockDoors = 50+.** Counting bays across the north and south faces of the
  addressed building yields ~180 doors (band 50+). Trailers are backed in along
  both faces in every detail image.
- **dropArea / dropYard = 50+ / true.** A dedicated trailer-storage yard north
  of the complex plus drop trailers staged mid-court — well over 50 stalls.
- **shipRcvSeparate = true.** Two distinct dock banks on opposite (N and S)
  building faces across separate courts.
- **postGateStaging = true, drivewayLong = true, fastLaneOpportunity = true.**
  Very wide dock courts give deep internal queuing room and physical width to
  add an express/bypass lane at the Harvest Dr entry.

## 4. Yard zones & counts (estimates from overhead imagery)

- **perimeter** — the addressed building's operational envelope (building + its
  north and south dock courts), ~26.5 acres. The broader campus is far larger.
- **truckGate** — Harvest Dr entry apron at the building's west/NW.
- **dropYards** — the trailer storage yard north of the complex.
- **dockAprons** — two thin strips hugging the building's north and south dock
  walls (the perpendicular trailer banks), traced at the building's true E-W
  orientation.
- dockDoorCount ~180 · trailersVisible ~320 · trailerParkingCapacity ~400 ·
  truckGateCount 1 · buildingCount 1 (audited parcel) · siteAreaAcres ~26.5 ·
  railServed false.

## 5. Setting & connectivity

- **urbanRural = Urban.** Dense Inland-Empire logistics fabric immediately
  west of I-15; major metro industrial corridor.
- **connectivityIssue = false.** Urban site, strong cellular coverage expected.
- **railServed = false.** No rail spur enters the property; truck-only import DC
  fed from the LA/Long Beach ports.

## 6. Web findings

- Walmart IDC 6060, 4250 Hamner Ave, Eastvale CA 91752; ~10,000 employees;
  opened ~2019; import/supply-chain DC.
- Sits in **Goodman Commerce Center Eastvale** (one of SoCal's largest mixed-use
  industrial developments), with Prologis-managed buildings — the east-perimeter
  Street View confirms Prologis branding on-site.
- Adjacent to I-15 between Cantu-Galleano Ranch Rd and Bellegrave Ave.

## 7. Caveats

- The campus contains several near-identical mega-warehouses; this audit covers
  the **single building addressed 4250 Hamner/Harvest** (geocode-confirmed). The
  Walmart operation may span more than one building, but `multipleFacilities` is
  set false for the audited parcel.
- Guard-shack vs. remote-guard is the only material uncertainty (flagged).

## Final verdict

- **Gate:** YES — fenced, access-controlled site; sliding security gates on the
  perimeter, truck entry off Harvest Dr.
- **Guard shack:** NO staffed booth resolved — classified remote-guard (kiosk /
  intercom). Lowest-confidence call.
- **Confidence:** high overall.
