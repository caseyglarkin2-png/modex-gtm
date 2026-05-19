# Deep-Audit Dossier — Campbell's Soup, Maxton NC

**Roster idx:** 1
**Type:** Manufacturing - thermal/aseptic soup
**Address:** 2120 NC Highway 71 N, Maxton, NC 28364
**Resolved center:** 34.770800, -79.325200
**Confidence:** high

## Location confirmation
Roster coordinates (34.771797, -79.325047) landed inside the plant footprint.
Satellite probes z16-18 around that point revealed a very large industrial
manufacturing campus surrounded by pine forest, consistent with a thermal/
aseptic soup plant. Street View on NC-71 N confirmed a Campbell's-branded
property sign and chain-link perimeter fence facing the highway. This is the
Campbell's Maxton soup plant — site of the named $150M aseptic soup expansion.

## Key views
- **z16 wide:** Full campus visible — multiple connected manufacturing
  buildings, silos and process equipment in the center, large warehouse blocks
  to the south, employee parking lots along NC-71, and a large trailer drop
  yard at the south end. Ringed by forest on the west, south, and east.
- **z19 center:** Soup-process buildings with cylindrical storage silos and
  tankage — confirms aseptic/thermal manufacturing.
- **z19/z20 south:** Drop yard packed with 80-100+ trailers in 8+ rows.
- **Street View NC-71:** Plant set back behind grass buffer and chain-link
  fence; Campbell's sign at roadside.

## Gate / guard-shack determination
- **Truck gate: TRUE.** The main entrance leaves NC-71 N on the north side and
  the entrance road splits into controlled lanes. At z20-21 a clear checkpoint
  apron with a small structure sits astride the entrance road (~34.7743,
  -79.3231).
- **Guard shack: TRUE.** z21 close-up shows a small dark-roofed booth (~1-2
  vehicle footprint) beside the checkpoint lane — a staffed guard house, not
  the main building.
- **remoteGs: FALSE** (guard shack present).
- Entrance apron is wide with room for added lanes -> `fastLaneOpportunity`.
- Gate-to-dock approach is long (campus is deep) -> `drivewayLong`, and there is
  ample paved area inside the gate -> `postGateStaging`.

## Yard zones and counts
- **Perimeter:** ~1060 m N-S x ~700 m E-W of fenced/cleared land -> ~165 acres.
- **Drop yard:** Large lot south of the plant, 80-100+ trailers; capacity ~130.
- **Dock aprons:** Dock banks distributed across multiple building faces; one
  clear apron near the SW warehouse with trailers backed in.
- **Dock doors:** ~40 estimated across the campus (banded 25-50; low confidence
  given distributed layout).
- **Buildings:** 8+ distinct structures -> `multipleFacilities` true.
- **Rail:** No spur entering the property observed.

## Web findings
Campbell's Maxton is a long-running soup/broth plant; roster notes a $150M
aseptic soup expansion. Setting is rural — small town of Maxton, surrounded by
farmland and pine forest.

## Final assessment
High confidence. Guarded entry with a guard booth, very large drop yard,
multi-building campus, rural setting. Low-confidence items: exact dock-door
count, presence of a truck scale, and whether shipping/receiving are split.
