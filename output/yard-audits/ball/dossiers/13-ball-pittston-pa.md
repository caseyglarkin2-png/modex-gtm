# Ball - Pittston PA (Jenkins Township) — Deep Yard Audit

**Type:** Beverage Can Plant (bodies) · **Confidence:** high
**Resolved center:** 41.2860, -75.7725 · [satellite](https://www.google.com/maps/@41.2860,-75.7725,400m/data=!3m1!1e3)
**Address:** 140 Industrial Dr, Jenkins Township, PA 18640 (CenterPoint Commerce & Trade Park East; former Techneglas building)

## Verification (Step -1) — CONFIRMED
Ball's own Feb-2025 locations map lists Pittston PA. Area Development / regional press (Dec 2020) documents Ball retrofitting the 1,078,799 sq ft Jenkins Township building (former Techneglas TV-glass plant) into an aluminum beverage can plant, ~$300M, ~230 jobs, production starting 2021. Not among Ball's 2022-24 closures. Owner-operated.

## Location resolution (Step 0)
Roster gave no coordinates. "140 Industrial Dr, Jenkins Township PA" geocoded rooftop to 41.2842, -75.7707; satellite confirmed one enormous bright-white-roof building — by far the largest structure in the area — consistent with the ~1.08M sq ft retrofit. (Note: the roster mentioned "CenterPoint"; the exact address is Industrial Dr in CenterPoint Commerce & Trade Park East.)

## Views
- **Wide z16:** a single very large building, long axis ~E-W (slightly tilted). Dock bank + trailer drop yard along the **south** (rail) face; **north** truck court with staged trailers + employee parking; a large empty paved **overflow/staging lot** at the NW; a freight rail line runs along the west edge; residential subdivision to the SW; PA-315 corridor to the east.
- **z17/z18 tight:** south face shows a long continuous dock bank with trailers backed in and more staged in the drop yard; NW corner shows the overflow lot and open access road; rooftop mechanical penthouse on the north.
- **Street View (Nov 2023):** open, un-barriered park roads; a wide flat staging lot with the plant in the background. No gate arm or guard booth at the building's truck court.

## Gate / guard / docks
- **Truck gate:** FALSE (flagged medium) — the truck court and lots open directly onto CenterPoint's spine roads; no road barrier or guard booth visible. Security likely at the dock doors, not a gate. This is a "no-gate / no-guard" open commerce-park archetype.
- **Docks:** **50+** dock doors — continuous bank along the south (rail-side) face plus docks on the north and west faces. Shipping/receiving plausibly split across separate faces (`shipRcvSeparate` true, flagged).
- **Drop / staging:** dedicated south drop yard (long trailer row) + a large NW overflow lot; combined capacity ~150 trailers, ~45 visible. `postGateStaging` and `drivewayLong` true; huge open lots (not backup-sensitive).

## Yard metrics
Dock doors ~60 (50+) · trailers visible ~45 · capacity ~150 · gates ~2 access points · buildings 1 · ~88 acres (building + courts + overflow lot; approximate) · **rail: adjacent line on west, no spur into building → false** (spur-add feasible).

## Setting
Jenkins Township industrial park at the wooded edge of the Scranton–Wilkes-Barre metro; adjacent residential subdivision and I-81. Classed **Rural** (edge-of-town industrial-park), cell coverage fine.

## Final confidence: high
Single, unambiguous, well-verified building. Flagged: gate/guard (open park), ship/rcv split, exact dock count and acreage are overhead estimates.
