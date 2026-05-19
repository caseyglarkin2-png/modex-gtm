# Pactiv Evergreen — Athens GA (idx 09)

**Type:** Manufacturing Plant (Beverage Merchandising — carton converting / gable-top carton stock)
**Resolved center:** 33.9799, -83.3890
**Address:** 600 Dairy Pak Road, Athens, GA 30607
**Confidence:** medium

## Location resolution

The roster geocode (33.979548, -83.389046, `ROOFTOP`) was accurate — it lands
on the main plant building of a multi-building industrial campus off Dairy Pak
Road, Athens GA. Confirmed at satellite z16-z19. This is the legacy Evergreen
Packaging / Pactiv Evergreen Athens carton-converting plant (Beverage
Merchandising). The street name "Dairy Pak Road" is itself a tell — the plant
historically produced gable-top dairy/juice carton stock.

## Key views

- **Satellite z16-z18 (overview):** a clear multi-building campus — a large
  main converting plant plus several adjacent manufacturing/warehouse
  buildings and ancillary structures (~6 distinct buildings). A rail line runs
  along the northeast edge.
- **Satellite z18 (NE dock face):** dock doors with trailers backed in along
  the northeast face of the main building (orange and white trailers visible);
  a trailer-parking strip runs alongside.
- **Satellite z19 (entrance):** the main entrance is a paved access area with
  employee parking and landscaped islands — an open industrial-park style
  entry.
- **Street View 2025-02 (Dairy Pak Rd):** a fenced compound with a chain-link
  gate and access-controlled entry near the southwest side; American flag,
  brick building, employee parking; the road continues into the plant. An
  established industrial district with dense surrounding development.

## Gate / guard-shack determination

- **truckGate = true.** The campus is bounded by fencing and the access roads
  reach the dock/yard area through controlled openings; a fenced compound with
  a chain-link gate is visible in Street View. Controlled entry.
- **guardShack = false (flagged uncertain) / remoteGs = true.** No clearly
  identifiable multi-window staffed guard booth at the main entrance in either
  satellite or Street View — the entrance reads as an open gated industrial
  entry. Best read: no guard shack, remote/unmanned check-in. Flagged
  uncertain.

## Yard zones and counts

- **Perimeter:** ~32 acres, fenced multi-building campus.
- **multipleFacilities = true** — a campus of ~6 buildings, not a single block.
- **Dock doors:** along the northeast face of the main building with trailers
  backed in; estimated ~20-25 across the campus (`dockDoors` 10-25,
  low-confidence count).
- **Drop yard:** a dedicated trailer-parking strip along the NE dock apron,
  separate from active dock positions; `dropArea` banded 10-25.
- **railServed = true (flagged uncertain)** — a rail spur/line runs along the
  northeast edge alongside the main building and appears to serve the
  property, consistent with a paperboard/carton plant receiving roll stock by
  rail. Cannot fully confirm the spur enters the property vs. runs adjacent.
- **fastLaneOpportunity = false** — the multi-building campus layout
  constrains the entrance and internal roads; limited room for a dedicated
  express lane.

## Web findings

Confirmed active Pactiv Evergreen / Novolex manufacturing & production
facility (Athens Area Chamber of Commerce; Pactiv Evergreen Locations page).
Beverage Merchandising segment — carton converting. Now operating under
Novolex post the April 2025 combination.

## Final confidence: medium

Location and campus type are clearly resolved. Medium rather than high because
the guard-booth determination and the rail-served call rely on imagery
interpretation (no clean Street View of the main truck gate), and the
dock-door count is an estimate across a multi-building campus.
