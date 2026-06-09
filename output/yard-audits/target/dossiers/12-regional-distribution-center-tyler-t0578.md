# Deep-Audit Dossier — Target Regional Distribution Center Tyler (T0578)

- **Facility:** Target Regional Distribution Center Tyler (T0578) — RDC
- **Address:** 13786 County Rd 433, Tyler, TX 75706
- **Resolved center:** 32.46437, -95.41160
- **Confidence:** HIGH
- **Method:** deep-audit (satellite z15–z21 + Street View + web)

## Location confirmation
The geocoded point landed directly on the building roof — correct, not a neighbor.
Web search confirmed an active Target RDC at 13786 County Rd 433, Tyler TX 75706,
operating 24/7 (Waze/Foursquare/Manta listings; Target corporate job postings for
"Regional Distribution Center – Tyler, TX"). Satellite shows a single ~600 m-long
white-roof distribution building with rooftop solar arrays, a large trailer yard on
the north face, and rural farmland/forest surroundings — consistent with a Target RDC
(~1.5 M sq ft class). No competing large building nearby. Site sits on the south side
of US-69. Locked center at 32.46437, -95.41160.

## Orientation
Building long axis runs roughly E–W, rotated a few degrees CCW from north (north dock
wall rises slightly toward the east). All zone quads were traced to that true angle,
not north-aligned.

## Key views
- **z15/z16 overview:** One large rectangular DC; trailer drop yard along the north
  face; employee parking south/SW; access road off US-69 entering at the NW corner;
  rural setting (fields, forest, a retention pond SE).
- **z18/z19 NW entry sequence (`sat-z19-entryseq`, `sat-z19-toproad`):** The access
  road off the highway pinches through a checkpoint — painted lane stripes/stop bar,
  an island, and a small white-roofed gatehouse with a lane canopy straddling the
  inbound/outbound lanes. Employee parking lots flank the gate; small red-roofed
  ancillary (maintenance) sheds sit just inside.
- **z19 north dock face (`sat-z19-docks-mid`):** Continuous bank of dock doors with
  dark trailers backed in along the full north wall; large rooftop solar arrays.
- **z18 east end (`sat-z18-eastedge`, `sat-z18-necorner`):** Dock bank + trailer drop
  yard on the east face/end; a small separate annex building sits inside the north
  trailer yard; trailers parked in long rows; farmland to the east.
- **Street View (pano `0Jg9kmSlp8EDDtrDYM1lsg`, 2023-01, @32.46747,-95.41535):**
  Looking E (`sv-gate-e`) shows the entrance drive with a Swift trailer staged and the
  gate/checkpoint structures in the mid-distance. Looking W (`sv-gate-w`) shows
  chain-link perimeter fencing along the access road out to US-69. Looking SE
  (`sv-booth-se`) shows the employee lot and gate area. Confirms perimeter fencing and
  the single guarded entry.

## Gate / guard-shack / remote determinations
- **truckGate = TRUE.** Single controlled truck entrance at the NW corner: access road
  off US-69 funnels through a checkpoint with painted lane markings and a canopied
  gatehouse. Not an open driveway.
- **guardShack = TRUE.** A small white-roofed booth (~1–2 vehicle footprint) with a
  canopy over the lanes sits between inbound and outbound lanes at the gate — a staffed
  guard booth, distinct from the main building.
- **remoteGs = FALSE.** A physical staffed booth is present, so this is not a
  kiosk/remote check-in.

## Yard zones & counts
- **Perimeter:** ~97 acres inside the fence (shoelace on the traced 6-vertex ring).
- **postGateStaging = TRUE:** large paved yard inside the gate before the docks.
- **dockDoors = 50+** (north face full-length dock line + east-face bank; ~120 doors est.).
- **dropArea / dropYard = 50+ / TRUE:** dedicated trailer-storage yard north of the
  building plus a second trailer lot off the east end, both full of parked trailers.
- **trailersVisible ≈ 220; capacity ≈ 320** (overhead estimate).
- **buildingCount = 2:** main DC + small annex inside the north yard. Treated as one
  campus, so `multipleFacilities = false`.
- **railServed = FALSE:** no rail spur into the property.
- **scale = FALSE:** no weigh pad in the truck path.
- **fastLaneOpportunity = TRUE:** wide multi-lane gate apron with spare paved width.

## Web findings
- Active 24/7 Target Regional Distribution Center; address and operation corroborated
  by Waze, Foursquare, Manta, and Target corporate/jobs pages.

## Final confidence
**HIGH.** Facility unambiguously identified; gate, guard booth, docks, and drop yards
all clearly visible in satellite (z19–z21) and corroborated by Street View. Low-confidence
items (exact lane counts, ship/rcv separation, exact door count) are flagged in
`uncertainFields`.
