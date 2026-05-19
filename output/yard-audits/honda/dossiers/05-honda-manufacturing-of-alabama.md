# Deep-Audit Dossier — Honda Manufacturing of Alabama (HMA)

**Facility:** Honda Manufacturing of Alabama (HMA), Lincoln AL
**Type:** Auto Assembly Plant + Engine Plant
**Address:** 1800 Honda Drive, Lincoln, AL 35096
**Resolved center:** 33.61550, -86.14400
**Confidence:** High

## Location confirmation
Roster coordinates (33.616074, -86.145538) landed near the plant center
(geocode moved 5.9 km from a city-level point but resolved to the plant).
Satellite probes (z14-z20) confirm a massive multi-building auto+engine plant
campus with an on-site vehicle test track, SW of Lincoln AL in Talladega
County. Web research (Encyclopedia of Alabama, Wikipedia, Automotive World)
confirms HMA is a ~4.9 million sq ft facility on a 1,350-acre property — the
first Honda facility with engine and vehicle assembly in the same complex,
building the Odyssey, Pilot, Passport and Ridgeline plus V6 engines.

## Key views
- **z14/z16 overview:** Enormous industrial complex amid woods and farmland,
  with a test-track loop to the north and extensive parking and trailer rows.
- **z18 south side:** Trailer rows backed against multiple building faces and
  parked in rows — many dozens of trailers.
- **z18 east side:** Large plant buildings with trailers along the east edge.
- **z16 north:** Test track loop and finished-vehicle staging lots; no rail
  spur into the property.
- **z17/z19 SW entrance:** A checkpoint structure with vehicle lanes visible
  where Honda Drive approaches the secured plant area.
- **Street View (Honda Drive, 2024-12):** Only wooded approach roads imaged;
  the plant gates are private with no public Street View coverage.

## Gate / guard-shack / dock determinations
- **truckGate: true** — A major OEM auto+engine plant runs as a fully secured
  private campus with controlled truck entrances. A checkpoint structure with
  vehicle lanes is visible at the SW entrance off Honda Drive. Treated true
  (medium confidence on lane geometry).
- **guardShack: true** — Guarded entry standard for a high-security plant of
  this scale; a small checkpoint structure is visible at the SW entrance.
  Exact form listed uncertain.
- **remoteGs: false** — Manned guarded entry assumed.
- **dockDoors: 50+** — Multiple long dock banks with trailers backed in on
  several building faces; overhead estimate ~120 doors.
- **dropArea / dropYard: 50+ / true** — Extensive dedicated trailer drop yards
  on multiple building faces; many dozens to hundreds of trailers visible.
- **shipRcvSeparate: true** — Dock activity on physically separate building
  faces.
- **multipleFacilities: true** — Campus of vehicle assembly, engine plant,
  support and logistics buildings, plus an on-site vehicle test track.
- **railServed: false** — No rail spur identified entering the property.
- **scale: false / multiStep: false** — No truck scale or second checkpoint
  clearly identified.
- **urbanRural: Rural** — Edge-of-town / rural setting SW of Lincoln AL amid
  woods and farmland.

## Yard zones & counts (overhead estimates)
- Perimeter: ~900 acres for the developed plant core plus lots (the full
  Honda-owned property is ~1,350 ac including test track and wooded buffer).
- Drop yards: 3 major zones boxed (south rows, east/NE rows, SW lot).
- Dock aprons: 2 banks boxed.
- dockDoorCount ~120, trailersVisible ~280, trailerParkingCapacity ~380,
  truckGateCount 3, buildingCount ~10.

## Web findings
HMA began production in 2001; it is a ~4.9M sq ft, 1,350-acre auto + engine
campus with combined annual capacity ~340,000 vehicles and ~340,000 engines.
The heavy trailer drop-yard footprint matches its high output and Honda's
as-needed supplier logistics model.

## Final confidence: High
Facility identity, scale, dock/drop bands and campus structure are clear from
imagery and web research. A checkpoint structure is visible at the SW entrance.
Gate lane geometry and guard-shack specifics are inferred — flagged uncertain.
