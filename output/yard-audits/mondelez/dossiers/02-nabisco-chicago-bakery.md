# Deep-Audit Dossier — Nabisco Chicago Bakery (Chicago IL)

**Account:** Mondelez · **Roster idx:** 2
**Type:** Manufacturing — biscuit/cracker bakery
**Address:** 7300 S Kedzie Ave, Chicago, IL 60629
**Resolved center:** 41.75880, -87.70650
**Confidence:** High

## Location confirmation
Roster coordinate (41.760327, -87.703165) landed at the residential edge just
NE of the plant. Satellite probes (z16-17) revealed a very large multi-building
industrial complex bordered by dense residential housing on the N/W and a major
rail corridor on the S. Street View along S Kedzie Ave (panos 2024-2025) shows
the multi-story bakery with a red **NABISCO** sign and a **Mondelez** monument
sign at the main entrance — positively confirming the facility. Locked center
moved ~330m SW to the building-complex centroid.

## Key views
- **Wide (z16-17):** Legacy urban plant — main building NE/E, huge trailer drop
  yard SW, employee parking lot on the north, all hemmed by residential streets
  and the Belt Railway corridor on the south.
- **Main entrance (z21 + Street View, ~41.7602,-87.7030):** Vehicle entrance off
  S Kedzie Ave with painted directional arrows splitting in/out lanes; a small
  white guard booth stands in the entry lot.
- **South building face (z19, 41.7576,-87.7055):** Rail spur tracks run directly
  along the building wall — rail loading.
- **SW drop yard (z18/z19):** Massive trailer storage lot, 100+ trailers parked
  in dense rows.

## Gate / guard-shack determination
- **truckGate = true.** The plant is fully perimeter-fenced (black metal fence
  visible all along the S Kedzie frontage in Street View). The main vehicle
  entrance crosses the fence line with split, arrow-marked in/out lanes.
- **guardShack = true.** A small white guard-booth structure is visible in
  multiple Street View panos standing in the entry parking lot just inside the
  Kedzie gate — staffed booth controlling access.
- **remoteGs = false** (manned booth present).
- **drivewayShort / backupSensitive = true.** Tight urban site: the gate sits
  directly on S Kedzie Ave (a busy 4-lane arterial) with little internal
  stacking — a truck queue would spill onto the public road.

## Yard zones & counts
- **Perimeter:** S 41.75660 / W -87.71230 / N 41.76150 / E -87.70250 — approx
  100 acres for the full fenced property.
- **Truck gate:** Kedzie entrance box around 41.7599-41.7605, -87.7033/-87.7027.
- **Drop yard:** large SW trailer lot, ~130 trailers visible, ~200 capacity.
- **Dock apron:** south rail-side and east-side dock banks.
- **Dock doors:** 50+ across multiple building faces.
- **shipRcvSeparate = true:** distinct dock clusters on different faces.
- **Rail:** spur runs along the south building face → railServed = true.

## Web findings
Guinness / Baking Business / Wikipedia: 7300 S Kedzie is a ~1,800,000 sq ft
facility — the largest bakery in the world — employing 1,500+ workers, producing
~320M lbs of snacks annually on a dozen+ football-field-length ovens. Makes Ritz
Crackers, Chips Ahoy, Cheese Nips, Premium, Nutter Butter, Barnum Animal
Crackers. Oreo production left the plant in 2016. Midwest hub for Mondelez.

## Final confidence: High
Facility unambiguously confirmed (NABISCO + Mondelez signage, web corroboration
of the world's-largest-bakery facts). Gate, guard booth, drop yard, rail
service, and docks all visible. Truck-scale presence and exact building count
left low-confidence; the plant is one continuous multi-section complex.
