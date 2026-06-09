# Deep-Audit Dossier — Target Regional Distribution Center, Stuarts Draft VA (T0560)

- **Facility:** Target Regional Distribution Center Stuarts Draft (T0560) — "Mid-Atlantic Distribution Center"
- **Type:** RDC
- **Address:** 345 Mount Vernon Rd, Stuarts Draft, VA 24477
- **Resolved center:** 38.03055, -78.99880 (geocoded point landed squarely on the DC roof — confirmed correct, no relocation needed)
- **Confidence:** HIGH

## Location confirmation
The supplied coordinates landed directly on a very large tilt-up distribution
building surrounded by farmland — consistent with a Target RDC. Confirmed via:
- Satellite (z16–z20): a single ~1.65M-sq-ft building running roughly E-W, with
  employee parking on the north, a continuous dock face + huge trailer drop yard
  on the south. Building dwarfs everything around it.
- Street View at the entrance off Mount Vernon Rd shows a **Target bullseye
  monument sign** and a Target directional sign — positive ID.
- Web research: S.B. Ballard / Site Selection / Virginia Business sources describe
  the Target "Mid-Atlantic Distribution Center" in Stuarts Draft as a 1,650,000-sq-ft
  building on a ~110-acre site with a ~38–39-acre building pad, completed 1996.

## Key views
- **Wide z16:** whole property visible as a rotated rectangle of pavement+building
  set in open farmland; entrance drive runs to Mount Vernon Rd on the east.
- **North side:** employee parking + a white water-tank/tower on the NE lawn (this
  is the only small standalone structure near the entrance — NOT a guard booth).
- **South side (z18–z20):** continuous dock-door rhythm with yellow apron markings
  along the entire south building wall; below it, rows and rows of parked trailers
  (the drop yard). West end face also carries dock doors with trailers.
- **East frontage (Street View, 5 frames):** continuous **chain-link perimeter
  fence** behind a grassy berm for the full length of Mount Vernon Rd — the site is
  fully enclosed. No driveway breaks the fence except at the main entrance.
- **Main entrance (Street View, pano 3Q-R_jUmE5xLJmHuTfNrgw, 2019-07):** wide
  two-lane paved entrance drive off Mount Vernon Rd, Target bullseye sign on the
  median; drive runs ~400 m west into the secured property.
- **SE truck driveway (Street View, pano Z-gTTeWquTahLtvjgc9VhQ, 2023-09):** the
  truck route from the south drop yard down to Mount Vernon Rd; building corner and
  fence visible on a berm.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** The property is fully fenced (chain-link confirmed in
  multiple Street-View frames). A single controlled entrance drive meets Mount
  Vernon Rd with Target signage; trucks funnel through it into the secured south
  yard. Definitely not an open site.
- **guardShack = FALSE (medium confidence).** No staffed booth (1–3-space footprint,
  multi-side windows) is visible at the road entrance in either satellite or Street
  View. The only small structure near the entrance is the water tower on the NE lawn.
- **remoteGs = TRUE (medium confidence).** Given a controlled, fenced truck gate but
  no visible staffed booth at the road, check-in is most likely via kiosk / call-box /
  app — the remote-guard pattern. Flagged as uncertain.
- **dockDoors = 50+.** A 1.65M-sq-ft building with continuous dock rhythm on the
  south face and additional doors on the west face — well over 100 doors. Estimated
  ~140 total.
- **dropYard / dropArea = TRUE / 50+.** Dedicated multi-row trailer-storage lot south
  of the dock apron, holding ~180 trailers in the captured imagery (capacity ~260).
- **shipRcvSeparate = TRUE.** Main dock bank on the long south face plus a separate
  dock bank on the west end face suggests distinct ship/receive clusters.
- **scale = FALSE.** No truck scale / weigh pad visible in the truck path.
- **urbanRural = RURAL.** Surrounded by active farmland on all sides, edge-of-town
  Stuarts Draft.

## Yard zones & counts measured
- **perimeter:** oriented quad tracing the fenced developed property (~53 acres of
  pavement+building). Note the broader parcel is ~110 acres including grassy buffer.
- **truckGate:** SE driveway entrance area off Mount Vernon Rd into the south yard.
- **dropYards:** one large ring covering the trailer-storage lot south of the docks.
- **dockAprons:** one long thin ring hugging the south dock wall at the building angle.
- **yardMetrics:** dockDoorCount ~140, trailersVisible ~180, capacity ~260,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~53, railServed false.

## Web findings
- 1,650,000 sq ft building (~38–39-acre pad) on a ~110-acre site; completed 1996;
  one of the top-10 largest tilt-up projects in the US at the time, largest in VA.
- Operating as a Target Regional/Mid-Atlantic Distribution Center; phone 540-932-3700.
- Sources: S.B. Ballard portfolio, Site Selection Insider, Virginia Business,
  CMac.ws warehousing listing, Target corporate careers (RDC Stuarts Draft jobs).

## Final confidence
**HIGH** overall (facility unambiguous, layout clear). Medium-confidence only on the
guardShack/remoteGs distinction — there is clearly a fenced controlled gate, but no
staffed booth is visible from available imagery, so remote check-in is inferred.
