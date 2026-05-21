# Pactiv Evergreen — Abilene TX (idx 06)

**Type:** Manufacturing Plant (Food Merchandising)
**Resolved center:** 32.459931, -99.81015
**Address:** 6450 Five Points Pkwy, Abilene, TX 79603
**Confidence:** high

*Backfill dossier — written to match the existing site JSON
(`sites/06-pactiv-evergreen-abilene-tx.json`). The JSON was not modified.*

## Location resolution

The roster geocode (32.459931, -99.81015, `ROOFTOP`) is accurate. It lands on
the Pactiv Evergreen Food Merchandising plant in the Five Points industrial
park on the northwest edge of Abilene. Confirmed by satellite z16-z18 and
Street View (captured 2025-01): a large light-roof manufacturing building with
a white-roof wing, employee parking with a landscaped circular drive, and
loading aprons — consistent with the named Pactiv Evergreen site.

## Key views

- **Satellite z16 (overview):** the plant sits in the Five Points Pkwy
  industrial park; open prairie immediately to the west and south, with sparse
  scattered industrial development. Edge-of-town setting.
- **Satellite z18 (north face):** ~6 dock doors on the north face with 5-6
  trailers backed in; a trailer-parking strip alongside.
- **Satellite z18 (southwest face):** ~8 dock doors on the southwest face of
  the white-roof wing, with wide unfenced gravel/paved aprons and a broad loop
  road.
- **Street View 2025-01 (Five Points Pkwy):** the truck driveway off Five
  Points Pkwy enters the property as an uncontrolled loop road — no barrier
  arm, gate, or pinch-point checkpoint anywhere along the property line;
  open employee parking fronting the road.

## Gate / guard-shack determination

- **truckGate = false.** Open site. The truck driveway off Five Points Pkwy
  enters the property as an uncontrolled loop road with no barrier arm, gate,
  or checkpoint pinch-point at any point along the property line — confirmed
  in Street View 2025-01 from multiple headings.
- **guardShack = false.** No staffed booth anywhere along the entrance road or
  dock aprons.
- **remoteGs = false** — there is no gate, so remote check-in does not apply.

## Yard zones and counts

- **Perimeter:** ~49 acres (per the site JSON geofence).
- **Dock doors:** ~6 on the north face plus ~8 on the southwest face — total
  estimated ~14 (`dockDoors` 10-25, low-confidence count).
- **shipRcvSeparate = true** — two physically separate dock banks: ~6 doors on
  the north face of the main building and ~8 doors on the southwest face of
  the white-roof wing. Likely separate ship/receive flows, though the
  functional split is not verifiable from imagery (flagged uncertain in the
  JSON).
- **dropArea = 0-10** — a modest trailer-parking strip; no large dedicated
  drop yard. `dropYard = false`.
- **drivewayLong = true** — the loop road and deep aprons give room for a 3+
  truck queue.
- **fastLaneOpportunity = true** — wide unfenced gravel/paved aprons at both
  dock banks and a broad loop road give ample room to add lanes; there is no
  current control to bypass.
- **railServed = false** — no rail spur enters the property.
- **urbanRural = Rural** — Five Points industrial park on the NW edge of
  Abilene; open prairie immediately west and south, sparse industrial
  development. Edge-of-town / rural setting.

## Web findings

Confirmed on the Pactiv Evergreen Locations page as a Food Merchandising
manufacturing plant; corroborated as a dossier-named site. Now operating under
Novolex following the April 2025 combination.

## Final confidence: high

Location, building, open-site layout, and dual dock banks are all clearly
resolved from satellite and Street View. The site JSON carries
`dockDoorCount` and `shipRcvSeparate` as uncertain fields — both are
imagery-derived estimates, but neither changes the high-level read: an open,
ungated, two-dock-bank manufacturing plant.

## Note on the JSON (not modified)

Minor internal-consistency observation only: the JSON sets `truckGate: false`
yet reports `entryLanes: 1` / `exitLanes: 1`. Lane counts are normally
recorded at a controlled gate; here they are best read as describing the
single uncontrolled loop-road driveway rather than a gated lane group. This is
not a substantive error and the JSON was left unchanged per instructions.
