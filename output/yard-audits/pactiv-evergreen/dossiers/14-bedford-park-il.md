# Pactiv Evergreen — Bedford Park, IL (idx 14)

**Address:** 7200 S. Mason Avenue, Bedford Park, IL 60638
**Type:** Manufacturing Plant (Foodservice)
**Resolved coordinates:** 41.761600, -87.769100 (campus center)
**Confidence:** High

## Location confirmation

The roster coordinates landed within a large multi-building industrial cluster
on S. Mason Avenue, just south of the Belt Railway of Chicago / Clearing rail
yard. Positively confirmed as the Pactiv Evergreen Bedford Park foodservice
manufacturing campus — a **Pactiv Evergreen blue branded sign is visible at
the office entrance** in 2025-04 Street View, and web research (loc8nearme,
Manta, Indeed reviews) confirms 7200 S. Mason Ave as the Pactiv foodservice
plant. The roster note ("multiple buildings on S. Mason Ave") matches what is
on the ground.

## Site layout

- A **multi-building Pactiv manufacturing campus** — four-plus large buildings
  clustered around a private internal access road running off S. Mason Avenue.
- The office / main entrance sits in a brick building on the east side of the
  campus drive (Pactiv sign here).
- Material/resin silos are visible between buildings — consistent with
  foodservice packaging manufacturing.
- Employee parking fills the apron between the buildings.

## Gate / guard-shack determination

- **Truck gate: FALSE.** The campus access road off S. Mason Avenue is an
  **open, unbarriered private drive** — no barrier arm, sliding gate, or
  checkpoint at the property line in either 2018-10 or 2025-04 Street View.
  Trucks drive straight in from the public road.
- **Guard shack: FALSE.** No booth structure of any kind at the campus
  entrance.
- **Remote GS: FALSE.** No gate exists, so the remote-check-in flag does not
  apply (per rubric: remoteGs is false when there is no gate).

## Docks & yard

- Dock banks on the southwest face of the dark-roofed central building (~8-10
  doors with trailers backed in) plus additional dock/drive-in doors on the
  brick building faces. Total banded **10-25** — flagged as an estimate.
- ~12 trailers visible across the campus aprons; estimated capacity ~20. No
  dedicated marked drop yard — `dropArea` "0-10", `dropYard` false.
- The internal campus road is long and deep → `drivewayLong: true`; ample
  queue depth between the public road and the dock banks.
- Single combined entry/exit at the campus drive; 1 inbound + 1 outbound lane.
- No truck scale, no second checkpoint, no clearly separate ship/receive
  cluster.

## Rail

**Rail-served: TRUE.** A rail spur curves into the campus from the NE,
connecting to the adjacent Belt Railway / Clearing Yard; rail cars are visible
on the spur in satellite imagery. The large bare-ground area to the NE is a
ComEd electrical substation, not part of the Pactiv property.

## Web findings

Pactiv Evergreen is the largest North American maker of foodservice / food
merchandising products and beverage cartons. The Bedford Park plant is one of
its Chicago-area foodservice manufacturing sites. Now part of Novolex
post-April-2025 combination.

## Setting

Urban — dense Chicago-area industrial fabric, immediately south of a major
rail classification yard, surrounded by warehouses and industrial buildings.
`urbanRural: Urban`, `connectivityIssue: false`.

## Final confidence: HIGH

Facility positively identified by on-site Pactiv Evergreen branding and
corroborating web research. The no-gate / no-guard-shack determination is
clear from two Street View vintages (2018, 2025). Dock-door count, trailer
capacity, and exact building count are estimates flagged as uncertain.
