# Deep-Audit Dossier — idx 18

## John Deere Kernersville (Deere-Hitachi Construction) — Kernersville, NC

**Type:** Assembly Plant (John Deere-branded hydraulic excavators)
**Roster address:** 1000 John Deere Rd, Kernersville, NC 27284
**Resolved center:** 36.13670, -80.09250
**Confidence:** high

## Step 0 — Location confirmation
The roster note flagged a 5,897 m geocode correction and a "new $70M factory
opening 2026". The supplied coordinate (36.136714, -80.092537, geocoded
ROOFTOP) landed directly on a large multi-building industrial complex with
visible active construction (exposed red-clay earthwork, a building under
construction). Web research confirms identity: John Deere Kernersville /
Deere-Hitachi, 1000 John Deere Rd - North American hydraulic-excavator
manufacturer, operations across 145 acres in a Main Campus and an East Campus,
1M+ sq ft. The $70M, 380,000 sq ft new factory for small (6-10 t) excavators is
under construction here. Audited site is correct - no correction needed.

## Site layout
A two-campus manufacturing operation:
- **Main Campus** (center/west): plate processing, welding, machining, paint.
  Large connected buildings, dock banks, and a finished-excavator staging yard.
  Extensive new construction / earthwork on the west and around the perimeter
  (the $70M small-excavator factory expansion).
- **East Campus** (east, ~36.134, -80.085): assembly and logistics. A large
  building with dock banks on its W face (trailers backed in), staged
  excavators and component/parts trailers in the yard.
- The two campuses are linked by internal/private access roads with staged
  trailers and components between them.
- Surrounded by woods, farmland, and some residential on the rural edge of
  Kernersville.

## Key views
- z15/z16 overview: confirmed both campuses + active construction.
- z18 Main Campus: large buildings, staged steel plate, trailers.
- z17/z18 East Campus: large assembly building, dock activity, staged
  excavators and parts trailers.
- z19 Main gate area: extensive trailer rows and staged material.
- z20 East Campus W dock: trailers backed into a continuous dock-door bank.
- z20 East Campus yard: finished excavators staged + rows of component trailers.
- Street View John Deere Rd (2026-03, very recent): definitive - Main Campus
  truck gate with guard booth, chain-link perimeter fence, sliding gate
  sections, and finished yellow excavators staged inside.
- Street View John Deere Rd east: rural two-lane road through woods.

## Gate / guard-shack / dock determinations
- **truckGate: true.** 2026-03 Street View on John Deere Rd clearly shows a
  controlled Main Campus entrance: chain-link perimeter fence along the
  property line, sliding gate sections across the drive, an entrance-lane
  pinch-point. Confirmed in z19 satellite.
- **guardShack: true.** A small white guard booth (~1-vehicle footprint) sits
  beside the Main Campus entrance lane - visible in 2026-03 Street View and
  z19 satellite. A staffed checkpoint.
- **remoteGs: false.** A physical staffed guard booth is present.
- **dockDoors: 25-50.** Dock banks on the Main Campus and the East Campus W
  face show a continuous dock-door rhythm with trailers backed in; counted ~30
  (some faces obscured by construction).
- **dropArea / dropYard: true, 50+.** Extensive trailer parking and staging
  across both campuses - dozens of trailers in rows plus large
  finished-excavator staging yards.
- **shipRcvSeparate: true.** Shipping and receiving run from physically
  separate dock clusters - Main Campus (plate/weld/machine/paint) vs. East
  Campus (assembly/logistics).
- **multipleFacilities: true.** Two large campus clusters across 145 acres,
  connected by internal roads; a third large building (new factory) was under
  construction.
- **scale: false.** No truck scale in the truck path.
- **urbanRural: Rural.** Facility is on the rural edge of Kernersville
  surrounded by woods/farmland; John Deere Rd is a rural two-lane road.

## Yard metrics
- dockDoorCount ~30 (band 25-50; some faces obscured by construction)
- trailersVisible ~80 across captured imagery (both campuses)
- trailerParkingCapacity ~120 trailers
- truckGateCount 2 (Main Campus gate confirmed; East Campus has its own access)
- buildingCount ~6 distinct/connected buildings (plus the new factory under
  construction)
- siteAreaAcres 145 (web-cited figure for the two campuses combined)
- railServed false (rail line passes the SW edge; no spur into the campuses)

## Web findings
johndeerekernersville.com, about.deere.com, deerehitachi.com, Greater
Winston-Salem Inc., ASSEMBLY magazine: John Deere Kernersville / Deere-Hitachi
manufactures John Deere-branded hydraulic excavators for North America.
Operations span 145 acres in a Main Campus (plate processing, welding,
machining, paint) and an East Campus (assembly, logistics), 1M+ sq ft of
manufacturing. A $70M, 380,000 sq ft new factory for small 6-10 t excavators is
being built, adding ~150 jobs - transferring excavator production from Japan.

## Final confidence: high
Facility identity, the guarded Main Campus truck gate, the guard booth, the
two-campus layout, and high-volume trailer/dock activity are all confirmed with
clear recent (2026-03) Street View and satellite evidence. The East Campus gate
count, exact dock-door count, and gate lane split are honest estimates (flagged
uncertain). Note: active construction means yard geometry will evolve.
