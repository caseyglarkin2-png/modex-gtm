# Yard Audit Dossier — Walmart Regional DC 7026, Grantsville UT

**Facility:** Walmart Regional Distribution Center 7026 (General Merchandise DC)
**Address:** 929 SR-138 (Highway 138), Grantsville, UT 84029
**Resolved center:** 40.62100, -112.50750
**Maps (satellite):** https://www.google.com/maps/@40.62100,-112.50750,400m/data=!3m1!1e3
**Method:** deep-audit · **Confidence:** high

---

## Location confirmation

The supplied coordinates (40.59967, -112.420335) landed in residential/farmland
Grantsville with no industrial building — they were ~7 km SE of the real site.
Web research (Yelp, YellowPages, 4URSPACE, Manta listings for "Walmart DC 7026")
confirmed the facility is a ~1.2M sqft distribution center built in 2005 on land
**west of Grantsville** at 929 SR-138. A wide z14 satellite sweep NW of town along
SR-138 immediately revealed the giant white-roofed cross-dock building. Locked the
center at **40.62100, -112.50750**. Street View at the entrance shows a Walmart
DC 7026 monument sign and Walmart-branded trailers, positively confirming the site.

The building sits in open high-desert terrain at the western edge of Grantsville,
with mountains to the north/east and a residential subdivision that has since been
built up against the SE corner.

## Key views

- **z14/z15 wide:** single very large rectangular cross-dock building, long axis
  running NW–SE (~N40°W), ringed on three sides by paved trailer-parking rows.
  SR-138 runs diagonally NW–SE along the NE side of the property.
- **z16/z17 center:** white roof with dock doors and backed-in trailers on the
  long faces; employee car parking at the N end; tank cluster near the E corner.
- **z18 SW dock face (wm11-sw-z18):** trailers backed tight into a continuous run
  of dock doors along the SW wall, plus several additional rows of drop trailers
  in the yard — high-density loading face.
- **z19 gate (wm11-guard-z19):** the checkpoint — a small booth sitting in the
  road median with inbound/outbound lanes splitting around it, and a semi stopped
  at the booth.

## Gate / guard-shack / dock determinations

- **truckGate = TRUE.** A controlled checkpoint sits ~250 m down a private access
  road that leaves SR-138 at a T-intersection (40.6258, -112.5085) and runs SW to
  the yard. The public-road junction itself is just turn lanes (no barrier), but
  the checkpoint on the access road shows lane-splitting and a stopped truck.
- **guardShack = TRUE.** A small square booth (~1–2 vehicle footprint) occupies the
  gate median, with the inbound and outbound lanes passing on either side
  (wm11-guard-z19). Distinct from the main building.
- **remoteGs = FALSE** — a staffed booth is physically present.
- **preGateStaging = TRUE / postGateStaging = TRUE.** Wide paved apron between the
  highway and the gate (pre), and a large paved check-in/staging lot inside the
  gate before the docks (post). The 2015 Street View pano sits in this inner
  staging lot among Walmart and Hub Group trailers.
- **drivewayLong = TRUE.** The ~250 m access road easily holds a 3+ truck queue;
  no risk of spillback onto SR-138 (not backupSensitive).
- **fastLaneOpportunity = TRUE.** The gate apron and approach road are very wide
  with unused paved width to add an express/bypass lane.
- **dockDoors = 50+** (estimated ~120). A 1.2M sqft RDC cross-dock with dock doors
  along both long faces.
- **dropArea = 50+ / dropYard = TRUE.** Hundreds of drop trailers in marked rows
  wrap the building on the SW, S, and N sides.
- **shipRcvSeparate = TRUE.** Two distinct dock banks on different (SW and NE) long
  building faces.
- **scale = FALSE / multiStep = FALSE / multipleFacilities = FALSE.** Single
  building; no truck scale or second checkpoint stage identified.
- **urbanRural = Rural.** Edge-of-town site in open desert/farmland; the abutting
  subdivision does not change the broadly rural setting.

## Yard zones and counts

- **perimeter:** 6-vertex oriented polygon tracing the graded/paved property edge
  at its NW–SE orientation. **~146.3 acres.**
- **truckGate:** rotated quad over the booth/checkpoint, aligned to the access road.
- **staging:** post-gate paved check-in lot inside the gate.
- **dropYards (3):** SW long trailer block, S/SE trailer block, N trailer block —
  each a quad aligned to the trailer rows.
- **dockAprons (2):** thin strips hugging the SW long dock wall and the NE long
  dock wall (trailer-length deep, long axis parallel to each wall).
- **yardMetrics:** dockDoorCount ~120, trailersVisible ~600, capacity ~700,
  truckGateCount 1, buildingCount 1, siteAreaAcres 146.3, railServed false.

## Street View

- **truckGate pano:** `F1U6o-lWLO7V5DSXtEBdUg` @ 40.62378, -112.51180 (2015-09),
  heading 139° — looks across the inner staging lot toward the booth/dock face;
  Walmart trailer ("WAL-MART / Always" #103269) and the DC building visible.
- **perimeter/entrance pano:** `et-FSFeNRdO6Rm7Y1fLp0w` @ 40.62581, -112.50846
  (2024-08), heading 213° — the SR-138 entrance with the Walmart DC 7026 monument
  sign and the access road heading into the property; the driver's-arrival frame.

## Web findings

~1.2M sqft Walmart distribution center completed in 2005 on ~28 acres of building
footprint (site graded much larger), a leading employer in Tooele County. Listed as
"Walmart DC 7026" / "Walmart Distribution Center, 929 SR-138, Grantsville UT 84029."
No rail service; freight is all over-the-road via SR-138 to I-80.

## Confidence

**High.** Facility positively identified and corrected from bad input coordinates;
gate, guard booth, dock density, and drop-yard all confirmed in high-zoom satellite
plus two corroborating Street View panos. Lane counts and the ~120 door / ~600
trailer figures are honest overhead estimates (flagged in uncertainFields).
