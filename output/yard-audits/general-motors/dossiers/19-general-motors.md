# GM - Marion Metal Center, Marion IN — Deep Audit (idx 19)

**Address:** 2400 W 2nd St, Marion, IN 46952 (Grant County)
**Resolved center:** 40.56381, -85.69851
**Type:** Metal Stamping Plant
**Confidence:** High

## Location confirmation
The roster address (2400 W 2nd St) geocodes onto W 2nd St inside a residential
block roughly 1.5 km east of the actual plant. Web research (GM Authority,
Mapcarta, GM media/heritage pages) gave the plant coordinates 40.56381,
-85.69851 at I-69 exit 64 on the west edge of Marion. Satellite at z16 confirmed
the large multi-roof stamping building there: a single interconnected plant of
~260 acres fronting W 2nd St on the south, bounded by the BNSF/CSX mainline and
rail spurs on the north, farm fields to the west, and a residential street to the
east. This is the GM Marion Metal Center (founded 1956 as Fisher Body; ~750+
employees; steel/aluminum blanks, stampings and sub-assemblies — doors, hoods,
deck lids, quarter panels, Tahoe/Suburban roof panels — shipped JIT to GM
assembly plants across North America). GM announced a $491M EV-stamping retool
plus earlier ~$90M upgrades.

## What the key views showed
- **Wide satellite (z15-16):** one massive multi-roof stamping building, employee
  parking and the main entrance fronting W 2nd St (south), rail line + spurs on
  the north, heavy outdoor material yard on the east, rail-served laydown on the
  west. Farm fields wrap the west and south.
- **South frontage (W 2nd St, Street View 2025):** main building face with flags
  and the employee/visitor lot; continuous chain-link perimeter fence along the
  entire frontage with a grass setback.
- **West / SW (Street View + satellite):** rail spurs cross into the property; a
  wide paved truck/rail freight drive runs along the west building face with
  coil/material laydown and trailers. Chain-link fence the full length.
- **East yard (z18-19):** vast paved yard packed with long rows of outdoor steel
  storage racks and stamping stock, plus rows of trailers; a big additional empty
  paved lot to the SE. Fenced along the east residential street with a perimeter
  gate/drive at the SE corner.
- **North (z18):** rail mainline + a spur curving into the NW yard; a vegetated
  retention basin between the rail and the docks.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The entire property is fenced (chain-link confirmed on the
  south, east and west street-view frames). Multiple controlled truck entrances:
  the primary SW truck/rail freight drive off W 2nd St, the front employee/visitor
  drive, and an east-side gate serving the trailer/material yard. truckGateCount
  estimated 3.
- **guardShack = true (medium confidence).** A fenced active GM stamping plant of
  this scale conventionally staffs a gatehouse at the freight entrance; small
  structures sit beside the entrances but a booth could not be individually
  resolved from overhead. remoteGs left false; both flagged uncertain.
- **dockDoors = "25-50" (~30, uncertain).** Doors spread across the west and
  NW building faces serving the rail-side laydown and inbound material drive;
  partly obscured by roof overhang.
- **shipRcvSeparate = true.** Inbound steel/rail handling on the west/NW (spurs +
  coil racks) is physically separate from the east trailer/finished-stamping
  shipping yard — two clusters on different building faces.

## Yard zones and counts
- **perimeter:** ~260 acres, oriented ring tracing the fenced property (rail line
  north, W 2nd St south, residential street east, farm field west).
- **truckGate:** SE perimeter freight gate/drive off the east street.
- **dropYards:** the east material/trailer yard (long rows of racks + trailers).
- **dockAprons:** the west/NW freight drive and dock face along the rail-served
  laydown.
- **dropArea = "25-50"; trailersVisible ~35; trailerParkingCapacity ~120**
  (the large empty SE paved lot pushes effective capacity well past 50).
- **railServed = true:** multiple spurs from the north mainline into the west/NW
  laydown.
- **fastLaneOpportunity = true:** very wide gate aprons and freight drives with
  unused paved width.
- **urbanRural = Rural:** edge-of-town small-city industrial with farm fields
  immediately west and south.

## Street View
- perimeter pano `v3GdZxOD8VrfieLrKxo_Ug` (W 2nd St, heading 350° toward the plant).
- truckGate pano `kcslOUspOk6UWvlhemU9CA` (east street, heading 325° toward the SE gate/yard).

## Summary
- **Gate:** YES — fully fenced, ~3 controlled truck entrances (SW rail/freight drive primary).
- **Guard shack:** Likely YES (staffed gatehouse expected at a 750+-employee GM plant) — medium confidence.
- **Confidence:** High on site identity, layout, rail and yards; medium on the exact guard-booth and dock-door count.
