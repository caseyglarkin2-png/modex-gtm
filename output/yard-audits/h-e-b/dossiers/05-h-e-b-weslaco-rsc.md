# Deep-Audit Dossier — H-E-B Weslaco RSC

**Facility:** H-E-B Weslaco RSC — Weslaco, TX
**Type:** Retail Support Center / Distribution Center
**Address:** 1100 Panther Dr, Weslaco, TX 78596
**Roster idx:** 5
**Audited:** 2026-05-18 · method: deep-audit

## Location confirmation
Roster coordinates (26.163308, -98.003269) carried a 3912 m geocode-shift
flag, but Step 0 probes confirmed they actually land correctly on the H-E-B
campus. Web search (Waze, Loc8NearMe, OpenGovUS) confirmed the **H-E-B
Weslaco Retail Distribution Support Center, 1100 Panther Dr, Weslaco TX
78596** — H-E-B's Rio Grande Valley distribution + transportation/dispatch
hub, ~26.1638, -98.0014. Locked working center at the RSC warehouse:
**26.162800, -98.002200**.

## Key views
- **z16 overview** — Solar-roofed RSC warehouse complex with a separate
  transportation/dispatch building; trailer-parking arrays on the NW and SW;
  bounded by Panther Dr to the north and an expressway + rail line to the
  south; a school sits to the NE.
- **z18 warehouse views** — Dock-door banks on the warehouse south and west
  faces with trailers backed in; drop yards of parked trailers.
- **North entrance Street View (2026-04)** — Chain-link perimeter fence
  around the campus; an H-E-B sign and a defined driveway with bollards at
  the Panther Dr main entrance; some active construction on the campus.
- **Internal Street View** — Large paved truck yard with trailers and
  tractors (red H-E-B cabs).

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** The campus is enclosed by a chain-link perimeter
  fence (confirmed in Street View). Main truck entrance off Panther Dr with
  H-E-B signage and a bollard-defined driveway.
- **Guard shack — FALSE.** No staffed guard booth clearly resolved at the
  entrance; a small structure sits near the gate but could not be confirmed
  as a booth. Classified `remoteGs: true` (kiosk / app check-in implied).
  Medium confidence — the entrance area also has active construction.
- **Dock doors — 50+.** Long dock-door banks on the warehouse south and west
  faces with trailers backed in (estimated ~70).
- **Drop area — 50+.** Trailer drop yards on the NW and SW of the campus.

## Yard zones and counts
- **Perimeter:** whole fenced campus ~60 acres.
- **Truck gate:** Panther Dr main entrance.
- **Drop yards:** NW trailer-parking zone and SW trailer-parking zone.
- **Dock apron:** the dock-bank strip along the warehouse south/west face.
- **Staging:** paved truck yard inside the gate.
- **Dock doors:** ~70 estimated. **Buildings:** ~3 (warehouse, dispatch /
  transportation, maintenance). **Trailers visible:** ~110, capacity ~170.
- **Rail-served:** no — a rail line runs along the south but no spur enters
  the property.

## Web findings
H-E-B Weslaco Retail Distribution Support Center, 1100 Panther Dr; serves the
Rio Grande Valley; the campus also hosts "HEB Weslaco Dispatch" and "HEB
Weslaco Facility Maint" operations (Yelp), consistent with the separate
transportation/dispatch building observed. Operating hours ~5 AM-9 PM daily.

## Final confidence
**Medium.** Facility positively identified (despite the geocode-shift flag,
the supplied point was correct); gate, dock and drop determinations well
supported. Guard-shack call and lane counts are estimates, and active
construction at the entrance limits precision.
