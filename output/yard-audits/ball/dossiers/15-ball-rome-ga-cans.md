# Ball - Rome GA (Cans) — Deep Yard Audit

**Type:** Beverage Can Plant (bodies) · **Confidence:** high
**Resolved center:** 34.3302, -85.0930 · [satellite](https://www.google.com/maps/@34.3302,-85.0930,400m/data=!3m1!1e3)
**Address:** ~395 West Hermitage Rd NE, Rome, GA 30161 (off GA-53, Northwest Regional Industrial Park, Floyd County)

## Verification (Step -1) — CONFIRMED
Ball's own Feb-2025 locations map lists Rome GA. The Oct-2019 Georgia state PR announcing Ball's new aluminum-**cups** plant explicitly describes it as being built **adjacent to Ball's existing aluminum beverage-can manufacturing plant** in Floyd County — confirming the can plant (this site) as an established, operating Ball facility. Not among Ball's closures. Owner-operated.

## Location resolution (Step 0) — plus the cans-vs-cups disambiguation
Roster idx 15 is the **CANS** plant. Web search confirmed **two adjacent Ball facilities** in Rome: the older/existing **beverage-can** plant and a newer (2020) **aluminum-cups** plant built next to it. "395 W Hermitage Rd NE" geocoded rooftop to 34.3303, -85.0931 — the can-plant complex. Satellite shows a grey-roof warehouse/finished-goods hall (rotated NW-SE) joined to a white-roof process hall (heavy rooftop equipment) on the SW; the separate cups plant sits just SW of it. The audited site = the can-plant complex only.

## Views
- **z17 overview:** grey warehouse hall + white process hall, employee parking to the W, a freight rail mainline along the E edge, GA-53 (West Hermitage Rd, divided) curving along the NW, the adjacent cups plant to the SW.
- **East z18:** grey warehouse SE (rail-side) apron with ~6 staged/backed trailers; rail line beyond a treed buffer (no spur into the site).
- **West/NW z18 + z19:** single entrance drive off West Hermitage opening onto a large internal apron and the employee lot; the white process hall's SW face has docks with trailers backed in.
- **Street View (May 2024):** West Hermitage Rd is a rural divided highway; plant set well back behind a tree line.

## Gate / guard / docks
- **Truck gate:** FALSE (flagged medium) — one open entrance drive onto a large apron; no guard booth or barrier arm visible at the throat.
- **Docks:** ~18 doors, **split across two faces** — the grey warehouse's SE (rail-side) apron (finished-can outbound) and the white process hall's SW face (coil/inbound) → `shipRcvSeparate` true (flagged). Band **10-25**.
- **Drop / staging:** SE apron holds parked trailers (`dropYard` true), ~15 visible, capacity ~40. Large internal apron before docks (`postGateStaging`, `drivewayLong` true); set back from the highway (not backup-sensitive).

## Yard metrics
Dock doors ~18 (10-25) · trailers visible ~15 · capacity ~40 · gates 1 · buildings 2 (connected warehouse + process hall; cups plant excluded) · ~40 acres · **rail: adjacent mainline on east, no spur → false**.

## Setting
NW Rome / Floyd County industrial park; fields, woods, Berry College nearby → **Rural** (small-city edge). Cell coverage fine. `multipleFacilities` true (adjacent Ball cups plant).

## Final confidence: high
Building and operator unambiguous and well-verified. Flagged: open gate call, ship/rcv split, exact dock count/acreage are overhead estimates.
