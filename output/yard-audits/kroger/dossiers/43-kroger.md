# Deep-Audit Dossier — idx 43 · Clackamas Bakery (Kroger / Fred Meyer)

**Facility:** Clackamas Bakery (Bakery Plant), 16253 SE 122nd Ave, Clackamas, OR 97015
**Resolved center:** 45.405470, -122.539650
**Confidence:** high
**Method:** deep-audit (satellite zoom 16-20 + Street View 2025-06 + web)

## Step 0 — Building confirmation
Supplied coords (45.405493, -122.539643) landed inside the large Fred Meyer
industrial superblock in Clackamas. That superblock holds two distinct
structures: a giant flat-roofed **distribution center** to the west, and the
**bakery plant** in the center. I confirmed the bakery is the center building by
its rooftop signature at z19 — dense process equipment (exhaust stacks, vents,
HVAC units, roof penetrations) consistent with a baking plant, versus the DC's
clean flat roof. Web search corroborated the address as Fred Meyer Bakery,
16253 SE 122nd Ave (bread/bakery manufacturing), distinct from the Fred Meyer
Distribution Center at 11500 SE Hwy 212. Locked center at 45.40547, -122.53965.

## Key views
- **z16/z17 wide:** single fenced Fred Meyer campus; bakery center, DC west, a
  large diagonal trailer drop yard between them, office + employee parking east.
- **z18/z19 building:** bakery long axis runs roughly N-S, a few degrees off
  north. Dock wall on the WEST face with trailers backed in; drop yard further
  west. East side is office building + striped employee parking.
- **z19 south frontage:** continuous chain-link perimeter fence set behind a
  landscaped buffer; rail line runs immediately south of the property (no spur in).

## Gate / guard / docks
- **Truck gate: TRUE.** Street View (south road pano C8abwANd58LFId5ej9kkFw and
  west road pano 0s-StLMrMX0ReqeP2ADWxQ, both 2025-06) shows continuous
  chain-link fencing wrapping the south and west sides with sliding-gate
  driveway openings and "AUTHORIZED" signage on the fence. A controlled, fenced
  truck entrance.
- **Guard shack: FALSE → remoteGs TRUE.** No staffed booth seen at any frontage
  gate in Street View or satellite. Fenced gates with no booth imply
  kiosk/call-box/badge check-in. Flagged uncertain because the campus is shared
  with the DC and a guarded main DC entrance may sit off the bakery's frontage.
- **Docks: 10-25 band (~24 doors est.).** Dock wall on the west building face,
  trailers backed in; partly tree-occluded from the road so count is an estimate.
- **Drop area: 50+.** Large drop yard of diagonally-parked trailers west of the
  building (shared DC overflow) holding well over 50 trailers.

## Yard zones & counts
- **perimeter** (8.5 acres): traced around the bakery's operational footprint —
  building + west drop yard + east office/parking strip — within the larger
  fenced superblock.
- **dropYard:** the diagonal trailer rows west of the dock wall.
- **dockApron:** thin quad hugging the west dock wall at the building's angle.
- **truckGate:** south sliding-gate opening.
- **staging:** null — the open drop-yard apron absorbs queueing; no distinct
  separate staging pad.
- dockDoorCount ~24 · trailersVisible ~70 · capacity ~90 · 1 gate · 1 building ·
  rail-served: false (line passes south, no spur).

## Web findings
Fred Meyer Bakery, 16253 SE 122nd Ave, Clackamas OR 97015 — bread/bakery
products manufacturing (Kroger). Co-located with the Fred Meyer Clackamas
Distribution Center (11500 SE Hwy 212) on the same industrial campus.

## Final confidence
High on location, gate, fencing, drop yard, and layout. Uncertain on exact dock
door count (tree occlusion) and on guardShack (shared-campus entrance ambiguity).
