# Deep-Audit Dossier — Honda Marysville Auto Plant (MAP)

**Facility:** Honda - Marysville Auto Plant (MAP), Marysville OH
**Type:** Auto Assembly Plant
**Address:** 24000 Honda Parkway, Marysville, OH 43040
**Resolved center:** 40.27780, -83.50600
**Confidence:** High

## Location confirmation
Roster coordinates (40.274666, -83.503609) landed on the southeast office /
parking cluster of the campus. Satellite probes (z15-z18) and the roster
address confirm the facility: this is the sprawling multi-building Honda
Marysville Auto Plant complex. Web search (Wikipedia, manufacturing.honda.com,
americanautoworker.com) corroborates the plant at 24000 Honda Parkway, ~6 mi
NW of Marysville near US-33 / SR-739. The assembly campus proper is the huge
contiguous dark-roof building complex centered ~40.2778,-83.5060; the roster
point sits at its SE edge.

## Key views
- **z15/z16 overview:** Enormous industrial campus — main assembly building,
  multiple connected/standalone logistics buildings, vast employee parking to
  the south, finished-vehicle lots and a rail yard to the north.
- **z17 docks view:** Single near-continuous assembly building with dock banks
  along the east edge and trailers backed in.
- **z17/z18 east side:** Extensive trailer drop yards — many dozens of trailers
  parked in rows against multiple building faces and in standalone lots.
- **z16 north (rail):** A multi-track rail yard with rail cars (autorack
  staging) runs directly into the property — facility is rail-served.
- **Street View (Honda Parkway, 2021-11):** Plant set well back behind lawn /
  wooded buffer; Honda Parkway is a private internal road, so public Street
  View does not reach the truck gates.

## Gate / guard-shack / dock determinations
- **truckGate: true** — A major OEM auto assembly plant operates as a fully
  secured private campus with controlled truck entrances. Honda Parkway itself
  is a private internal road. Treated true; exact lane geometry not resolvable
  from public Street View (medium confidence on lane counts).
- **guardShack: true** — Guarded entry is standard for a high-security auto
  plant of this scale; not individually resolved on imagery. Listed uncertain.
- **remoteGs: false** — Manned guarded entry assumed.
- **dockDoors: 50+** — Dock banks with trailers backed in along multiple long
  building faces. Overhead estimate ~90 doors.
- **dropArea / dropYard: 50+ / true** — Dedicated trailer drop yards on
  multiple faces and standalone lots; 200+ trailers visible.
- **shipRcvSeparate: true** — Dock activity on physically separate building
  faces (logistics/sequencing building vs main plant).
- **multipleFacilities: true** — Campus of assembly, logistics, paint, stamping
  and associated buildings.
- **railServed: true** — Multi-track rail yard runs into the north of the site.
- **scale: false / multiStep: false** — No truck scale or second checkpoint
  clearly identified.
- **urbanRural: Rural** — Open farmland setting NW of Marysville.

## Yard zones & counts (overhead estimates)
- Perimeter: ~720 acres (large secured campus, fence line approximated).
- Drop yards: 3 major zones boxed (north logistics yard, east trailer rows,
  south trailer rows).
- Dock aprons: 2 banks boxed.
- dockDoorCount ~90, trailersVisible ~240, trailerParkingCapacity ~320,
  truckGateCount 3, buildingCount ~8.

## Web findings
manufacturing.honda.com and Wikipedia confirm MAP performs stamping, plastics
injection molding, welding, painting, sub-assembly and assembly — consistent
with the large multi-process campus seen. Honda's logistics model uses
as-needed supplier shipments, consistent with the heavy trailer drop-yard
footprint.

## Final confidence: High
Facility identity, scale, dock/drop bands, rail service and campus structure
are all clear. Gate lane geometry and guard-shack specifics are inferred from
facility type (auto OEM plant) rather than directly imaged — flagged uncertain.
