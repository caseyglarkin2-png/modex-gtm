# Deep-Audit Dossier — Hormel Knoxville Plant (Knoxville, IA)

**Roster idx:** 4
**Type:** Production Facility
**Resolved center:** 41.31730, -93.06100
**Confidence:** Medium

## Location resolution
The roster address ("703 E Robinson St") and coordinates (41.318297,
-93.091383, "RANGE_INTERPOLATED") landed in **residential Knoxville** — no
industrial building. Web research established the correct address:
**209 N Godfrey Ln, Knoxville, IA 50138**, on the east edge of town.
Satellite probing at z17-z18 around 41.3173, -93.0610 confirmed a single
processing plant with employee parking, a south-face dock, and a trailer drop
yard. Web confirms the Hormel Knoxville Plant: dry sausage (pepperoni/salami),
~150 production employees, ~1M lbs of dry sausage per week.

Note: a separate heavy-industrial complex (process tanks, cooling towers) sits
immediately west of Godfrey Lane — it is **not** the Hormel plant; the Hormel
plant is the food-processing building east of Godfrey Lane.

## Key views
- **z17 overview** — single moderate-sized processing plant; employee parking
  on the north/west, dock face on the south, trailer drop yard further south.
- **South dock face (Street View ent2, 2026-04)** — trailers backed into dock
  doors along the south building wall under a red dock canopy.
- **South drop yard (z18)** — ~15-20 angled trailer stalls between the plant
  and the rail line.
- **Entrance (Street View, 2026-04)** — the property is enclosed by a
  continuous chain-link perimeter fence; a single gate opening controls the
  driveway off Godfrey Lane. No guard booth.

## Gate / guard-shack / dock determinations
- **truckGate = true** — Continuous chain-link perimeter fence with a single
  defined gated driveway entrance off Godfrey Lane. No barrier arm positively
  resolved in imagery, but the fenced perimeter plus one controlled gate
  qualifies as a controlled truck entrance. Flagged uncertain.
- **guardShack = false** — No staffed booth visible at the entrance.
- **remoteGs = true** — Gate present, no guard booth — implies kiosk / badge /
  app check-in. Flagged uncertain.
- **drivewayLong = true** — Long open driveway from Godfrey Lane into the
  parking/dock area; holds a 3+ truck queue.
- **dockDoors = 10-25** — Dock face on the south building wall, ~8-12 trailers
  backed in. Overhead estimate.
- **dropArea = 10-25** — Dedicated south drop yard with ~15-20 trailer stalls.
- **dropYard = true** — Separate trailer-storage lot south of the plant.

## Yard zones and counts
- **Perimeter:** ~42 acres of fenced plant property.
- **Drop yard:** angled-stall trailer lot between the plant and the rail line.
- **Dock apron:** strip along the south building face.
- **Staging:** no separately defined staging area.
- **yardMetrics:** ~14 dock doors, ~28 trailers visible, ~35 trailer capacity,
  1 truck gate, 1 building, not rail-served.

## Web findings
- Hormel Knoxville Plant: dry sausage (pepperoni, salami), ~150 production
  professionals, ~1M lbs/week; ~40 minutes SE of Des Moines.

## Final confidence
**Medium.** Facility positively re-identified after correcting a wrong roster
address/coordinate. The perimeter fence is clear, but the entrance gate type
(barrier vs. open rolling gate) and the absence/presence of a check-in kiosk
cannot be fully resolved from imagery, so `truckGate`/`remoteGs` and the dock
count are flagged uncertain.
