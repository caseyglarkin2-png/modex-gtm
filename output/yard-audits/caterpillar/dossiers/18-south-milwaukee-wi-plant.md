# Deep-Audit Dossier — Caterpillar Global Mining South Milwaukee WI Plant (idx 18)

## Resolved location
- Roster gave 1100 Milwaukee Ave, South Milwaukee, WI 53172, lat/lng
  42.912672,-87.861727 (geocode GEOMETRIC_CENTER, movedMeters 234). The point sits
  on the campus — accurate enough.
- Confirmed: the historic former **Bucyrus** heavy-equipment works (manufacturing
  on this site since 1893), operated by **Caterpillar Global Mining** since
  Caterpillar's 2011 purchase of Bucyrus. The plant produces massive Cat electric
  rope shovels (7495 series) and draglines — more than 32,000 machines built here
  over 130 years.
- **Locked center:** 42.91270, -87.86150 (main N-S building corridor).

## Key views
- z15-z17 probes: a long N-S heavy-industrial corridor of ~8 large connected
  manufacturing buildings, large open paved assembly/staging yards, and rail lines
  along the W side, all embedded in the dense South Milwaukee residential grid.
- z18-z19 W side: multiple rail spurs running directly into the property.
- z18-z20 E side / Milwaukee Ave: the buildings and a concrete perimeter wall front
  directly onto the public street; houses directly across.
- z19-z20 entrance: gated openings in the perimeter wall, parking lots, a small
  structure with signage at the main W/N gate.
- Street View (2018-2025): a continuous concrete perimeter wall along Milwaukee Ave;
  gated vehicle entrances with signage; the works visible behind the wall.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The entire complex is enclosed by a perimeter wall/fence.
  Vehicles enter via controlled gated openings; this is a fully enclosed industrial
  works.
- **guardShack = true (MEDIUM confidence — flagged).** A small structure with
  signage sits at the main entrance gate, consistent with a security checkpoint for
  a fenced heavy-industrial works. Not as cleanly imaged as a freestanding booth.
- **dockDoors = "0-10".** This is a heavy-fabrication plant, NOT a distribution
  facility — it has large oversized shop/bay doors and open assembly yards rather
  than a regular dock-door bank. Estimated 0-10 conventional dock equivalents.
- **railServed = true.** Multiple rail spurs run directly into the property along
  the W side; oversized shovel components ship by rail.
- **backupSensitive = true.** The complex fronts directly on public city streets
  with minimal setback — a gate queue would spill onto the road.

## Yard zones and counts
- **Perimeter:** ~72 acres, a long narrow N-S corridor (box 42.9085-42.9165 N,
  -87.8642 to -87.8601 W).
- **Drop yards / staging:** large open paved yards used to stage oversized
  components — not marked trailer-parking stalls (so dropYard = false).
- **dockAprons:** none in the conventional sense.
- **buildingCount = 8** (campus → multipleFacilities = true).
- **railServed = true** — multiple spurs into the property.

## Web findings
- South Milwaukee plant: manufacturing since 1893 (Bucyrus); Caterpillar since 2011.
  Produces Cat electric rope shovels and draglines; the historic source of the
  shovels that built the Panama Canal. Caterpillar marked 130 years here in 2023.

## Final confidence: medium
Facility positively identified (well-documented historic Bucyrus/Cat works) and
located. It is a heavy-fabrication plant, so dock-door / drop-yard fields are
characterized accordingly and flagged. The guard-shack and exact gate count are
medium-confidence reads and flagged.
