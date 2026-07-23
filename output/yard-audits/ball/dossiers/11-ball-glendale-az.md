# Ball - Glendale AZ — Deep Yard Audit

**Type:** Beverage Can Plant (bodies) · **Confidence:** medium
**Resolved center:** 33.5781, -112.3845 · [satellite](https://www.google.com/maps/@33.5781,-112.3845,400m/data=!3m1!1e3)
**Address:** ~15102 W Peoria Ave, Glendale/Waddell AZ 85355 (SE corner Reems Rd & Peoria Ave, Woolf Logistics Campus)

## Verification (Step -1) — CONFIRMED
Ball's own Feb-2025 global locations map lists Glendale AZ as an operating site (Phoenix and St. Paul, the two AZ/MN plants Ball closed in 2022-23, are correctly absent). The 2019 GPEC/Arizona development PR names Ball Corporation as builder of the can plant on this Reems/Peoria campus; production started Q1 2021. The AZ "Ball plant closure" in the news was the older **Phoenix** site, not Glendale — Ball was ramping Glendale up at the same time. Owner-operated, self.

## Location resolution (Step 0)
The roster gave no coordinates. Web search placed the plant at the SE corner of Reems Rd & Peoria Ave in the Woolf Logistics Industrial Campus. This is an **integrated three-company campus**: press describes a 712,000 sq ft Ball can-body plant whose cans travel a **280-ft conveyor bridge** to the adjacent **Red Bull/Rauch filling hall**, then a **418-ft bridge** to the **"Project Lagerhaus"** distribution warehouse. Satellite confirmed a connected chain of three large buildings:
- **West:** a large low-feature box (warehouse).
- **Center:** the process/manufacturing hall — heavy rooftop mechanicals + a large on-site electrical **switchyard** (can body-making is very power-intensive) + its own trailer staging and dock bank. **This is the audited Ball building** (also where the "Ball Metal Beverage Container Glendale" address geocodes).
- **South:** a solar-roofed building with a long row of dock doors and ~40 staged trailers = the Lagerhaus distribution center.

Building-level attribution on a shared, bridge-connected campus is inherently **medium confidence** — flagged.

## Views
- **Satellite z15–z18:** grid-aligned campus (square to Peoria Ave, so geofences are near-north-aligned, which is correct here). The Ball hall shows process equipment, a switchyard, silos, an east trailer-staging yard, and a south dock hall. Undeveloped desert to the east (future expansion).
- **Street View (Peoria Ave, Nov 2024):** the campus is set back behind landscaped screen walls with a controlled entry drive; a Biagi Bros (Red Bull's carrier) curtain-side trailer was staged at the road. Building signage not readable from the public road; the site is clearly a secured corporate campus.

## Gate / guard / docks
- **Truck gate:** TRUE — secured, screen-walled campus with a single controlled entry drive off Peoria Ave.
- **Guard shack:** TRUE (medium) — a small booth-like structure sits at the entrance; guard-vs-kiosk not fully resolvable from imagery. `remoteGs` false.
- **Docks:** ~16 external dock doors estimated (south-hall NE face + east yard). Most finished cans leave by the internal conveyor bridge, so external docks are modest for a building this size. Band **10-25**.
- **Drop / staging:** dedicated east trailer-staging yard (`dropYard` true), ~28 trailers visible, capacity ~50. Large internal paved apron before the docks (`postGateStaging` true), long internal approach (`drivewayLong` true). Huge paved aprons + undeveloped land = clear `fastLaneOpportunity`.

## Yard metrics
Dock doors ~16 (10-25) · trailers visible ~28 · capacity ~50 · gates 1 · buildings 1 (audited; campus has 3+) · ~31 acres (Ball parcel within campus) · **rail: none** (all-truck plus internal bridges).

## Setting
Far NW edge of the Phoenix metro, active master-planned industrial park with adjacent residential subdivisions → **Urban**; good cellular (no connectivity issue). `multipleFacilities` true (campus).

## Final confidence: medium
Verification is solid (confirmed, current). The medium grade reflects (1) building-level attribution on an integrated Ball/Red Bull/Rauch campus and (2) a gated, screen-walled site that limits ground-level gate/guard detail.
