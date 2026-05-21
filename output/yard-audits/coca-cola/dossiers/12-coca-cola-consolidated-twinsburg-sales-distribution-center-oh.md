# Deep-Audit Dossier — Coca-Cola Consolidated, Twinsburg Sales & Distribution Center, OH

**Roster idx:** 12
**Facility type (roster):** Sales / Distribution Center — *corrected: Manufacturing / Bottling Plant*
**Confidence:** Medium

## Location resolution
The roster address (8909 Twin Hills Pkwy) is **wrong**. The roster type
("Sales / Distribution Center") is also inaccurate. Web research establishes
the actual facility as **Coca-Cola Consolidated's Twinsburg manufacturing /
bottling plant at 1882 E Highland Rd, Twinsburg OH 44087** — a 300,000+ sq ft
plant operating since 1974, producing 31M+ cases/year, with a $35M new
can-line investment announced Oct 2025 (~260 employees). The campus is also
home to Red Classic Transit; the company's separate storage warehouse is in
Macedonia ~2 miles away.

Resolved via an OpenStreetMap geocode of 1882 Highland Rd (41.2977, -81.4538)
followed by satellite identification of the plant complex. Locked center:
**41.29630, -81.45540**. Positively confirmed by **"Coca-Cola" branding
clearly visible on the building wall** in Street View (2023-07).

## Key views
- **Complex (z17/z18):** A large multi-section manufacturing plant plus a
  separate large building to the south; massive herringbone trailer drop yards
  filling the central/east yard.
- **East dock face (z19):** Long dock-door row with many white trailers backed
  in.
- **Trailer yards (z19):** Multiple blocks of herringbone-parked trailers —
  very high truck throughput.
- **Truck entrance (Street View 2022/2023):** A defined truck driveway off E
  Highland Rd with yellow lane-control bollards and a perimeter chain-link
  fence with a gated opening; a Coca-Cola facility sign at the entrance.

## Gate / guard-shack / dock determinations
- **truckGate: true.** Defined truck driveway off E Highland Rd with yellow
  lane-control bollards and a perimeter chain-link fence with a gated opening
  — a controlled checkpoint pinch-point. Flagged uncertain: a barrier arm was
  not unambiguously resolved in the imagery.
- **guardShack: false.** No clearly staffed guard booth at the road entrance;
  nearby structures read as facility buildings, not a booth.
- **remoteGs: true.** A gated/fenced truck entrance with no guard booth implies
  kiosk / call-box check-in. Flagged uncertain.
- **Docks:** Long dock-door row on the plant's east face → ~30-40 doors (band
  25-50).
- **dropArea: 50+** — very large herringbone trailer drop yards.
- **multipleFacilities: true** — main plant plus a separate large south
  building.

## Yard zones and counts
- **Perimeter:** ~40-acre campus (S 41.29410 / W -81.45760 / N 41.29800 / E
  -81.45300).
- **Drop yards:** central/east herringbone trailer yard and a south trailer
  block.
- **Dock apron:** plant east-face apron.
- **yardMetrics:** ~38 dock doors, ~160 trailers visible, ~220-trailer
  capacity, 1 truck gate, 3 buildings, ~40 acres, no rail spur.

## Web findings
Twinsburg plant on E Highland Rd; 300,000+ sq ft; producing 31M+ cases/year
(2025); $35M new can-line investment Oct 2025 adding 40 jobs (~260 total);
ships to NE Ohio, PA, IN, KY; campus also houses Red Classic Transit.

## Final confidence
**Medium.** Facility identity is confirmed (Coca-Cola wall branding) and the
location is corrected from the wrong roster address. Gate verdict is medium
confidence — a fenced, bollard-controlled truck entrance is clear, but a
barrier arm / guard booth could not be definitively resolved (flagged in
`uncertainFields`). Dock count and lane counts are best-effort estimates.
