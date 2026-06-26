# Deep-Audit Dossier — idx 25 · Jackson Hutchinson Dairy (Kroger)

**Facility:** Jackson Hutchinson Dairy (Kroger Manufacturing, DBA Jackson Dairy)
**Type:** Dairy Plant
**Address:** 2600 E 4th Ave, Hutchinson, KS 67501
**Resolved center:** 38.0593, -97.8818
**Method:** deep-audit · **Confidence:** high

## Step 0 — Location confirmation
The supplied point (38.058791, -97.883467) landed on the west edge of a large
industrial complex. Web search confirmed the site as **Kroger DBA Jackson
Dairy**, a Kroger Manufacturing dairy plant at 2600 E 4th Ave, Hutchinson KS
(milk processing / bottling, juices, waters; ~90+ employees). Satellite at
z16-z20 and Street View (2025) positively identify the building: the central
mass carries roof-mounted process tanks and a row of vertical **milk storage
silos** (visible in Street View heading 315 from E 4th Ave) — the classic dairy
plant signature — alongside Kroger/Jackson/Ralphs-branded reefer trailers.
Real center locked at 38.0593, -97.8818.

## What the key views showed
- **z16/z17 overview:** A large fenced campus (~70 acres) bounded by E 4th Ave
  (south), a N-S road + green buffer (west), a N-S road + drainage ditch
  (east), and a rail spur with a long covered rail-loading dock structure
  (north). Two major building masses — the dairy plant and an attached/adjacent
  distribution warehouse — plus the north rail dock. Trailers everywhere.
- **Street View along E 4th Ave (2025):** Continuous **chain-link perimeter
  fence** the length of the frontage, with a Kroger "Now Hiring" recruiting
  banner zip-tied to it. Front office entrance (orange roof), employee/visitor
  parking inside the fence, milk silos behind.
- **z19/z20 tight south face:** Dock-door numbering visible into the 20s ("25",
  "22", "21" markers) with trailers backed in; dense trailer drop rows along the
  south fence; a gated driveway opening (with a "NO TRUCKS" sign on one lane)
  feeding the yard.
- **West road:** Wide green setback, no gate — trucks do not enter from the far
  west road; drop trailers stage on the building's west face inside the fence.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Property is fully chain-link fenced; truck access is via
  gated driveway openings through the fence (confirmed at the SW driveway and
  office driveway off E 4th Ave). Controlled entry.
- **guardShack = false.** No staffed booth structure at any truck entrance in
  satellite or Street View. The only small structure (mid parking lot near the
  office) reads as an employee shelter, not a gate booth. (Flagged uncertain.)
- **remoteGs = true.** Fenced/gated entry without a guard booth implies
  kiosk / call-box / app check-in.
- **dockDoors = 50+.** South plant face shows numbering into the mid-20s; add
  the north DC and west-face docks → ~80 estimated across the campus.
- **dropArea / dropYard = 50+ / true.** Dedicated trailer-storage rows on the
  south frontage, west of the plant, and around the north DC — many AMERICOLD /
  Kroger-brand reefer trailers parked nose-out.

## Yard zones & counts measured
- **Perimeter:** ~70-acre grid-aligned rectangle (NW 38.06215/-97.88462 →
  NE 38.06204/-97.87844 → SE 38.05745/-97.87844 → SW 38.05745/-97.88489).
- **truckGate:** SW driveway opening off E 4th Ave.
- **dropYards (3):** south frontage row, north DC apron/yard, west-face trailer
  storage.
- **dockApron (1):** long thin strip along the plant's south dock wall.
- **Metrics:** dockDoorCount ~80; trailersVisible ~100; capacity ~150;
  truckGateCount 2; buildingCount 3; siteAreaAcres ~70; **railServed = true**
  (north covered rail dock + spur).

## Web findings
Kroger Manufacturing / Jackson Dairy, Hutchinson KS — fresh dairy, Simple Truth
milk, waters, teas, juices; part of Kroger's manufacturing division; (620)
694-6900; 90+ employees. EPA TRI facility record on file (industrial chemical
reporting), consistent with a full processing plant.

## Final confidence: HIGH
Facility identity, fencing, drop-yard density, rail service, and dock scale are
all well-supported by 2025 Street View + tight satellite. Uncertain: presence of
a guard booth (none seen, but partial pano coverage), a truck scale (none seen),
and exact entry/exit lane counts.
