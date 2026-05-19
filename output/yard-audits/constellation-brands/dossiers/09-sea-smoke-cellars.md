# Deep-Audit Dossier — Sea Smoke Cellars (idx 9)

**Account:** Constellation Brands
**Facility:** Sea Smoke Cellars — Lompoc, CA
**Type:** Winery / Production Facility
**Address:** 1604 N. O Street, Lompoc, CA 93436 (winemaking facility)
**Resolved coords:** 34.664044, -120.465851
**Confidence:** High

## Step 0 — Location confirmation
Roster coordinates carried `movedMeters: 1399`, so the address was
re-geocoded via the Google Geocoding API: 1604 N O St, Lompoc resolves to
exactly 34.6640444, -120.4658515 (ROOFTOP) — identical to the roster coords.
Satellite probes (z17-z21) showed a long winery production building (maroon
roof) in the Lompoc industrial / "Wine Ghetto" district near the city airport.
Web search confirmed Sea Smoke Cellars' winemaking facility is at 1604 N O
Street and that Constellation Brands acquired Sea Smoke in May 2024. Locked
center on that building.

## Key views
- **z17/z19 wide:** Industrial district at the edge of Lompoc — airport runway
  to the north, light-industrial buildings, farmland on the west. Sea Smoke is a
  long N-S maroon-roof building; N O Street ends in a cul-de-sac turnaround at
  its west side.
- **z20/z21 tight:** The Sea Smoke building with a row of large white wine
  storage tanks lined along its east face; a paved work yard / drive between the
  tanks and the neighboring (unrelated) industrial building; stacked totes/bins
  and small equipment in the yard.
- **Street View (Sep 2025):** West facade is a modern white building with stone
  accents (office/public-facing end). The long west face seen from the cul-de-sac
  shows personnel doors and small windows — no dock-door bank. Access off N O
  Street is open; no gate, no guard booth.

## Gate / guard-shack / dock determinations
- **truckGate: false** — Property fronts a public street that dead-ends in a
  cul-de-sac. Parking and the east-side tank/work yard are reached directly with
  no barrier arm, gate, or checkpoint.
- **guardShack: false** — No staffed booth anywhere on the site.
- **remoteGs: false** — No gate exists, so no remote check-in implied.
- **dockDoors: 0-10** — Winery production building; no freight-dock bank. ~2-4
  at-grade service/roll-up doors estimated along the east working face by the
  tank farm. (Low confidence on exact count.)
- **dropYard / dropArea: false / NONE** — No trailer-storage lot; the east-side
  row is outdoor wine storage tanks, not parked trailers.

## Yard zones and counts
- **Perimeter:** ~4.5 acres enclosing the building, its east-side tank/work yard,
  and the parking off the cul-de-sac.
- **truckGate zone:** none — open street access, left null.
- **dockApron:** the paved work strip along the east face by the tank farm.
- **dropYards / staging:** none clearly identifiable.
- **yardMetrics:** ~3 service doors; 0 trailers visible; ~2-trailer informal
  capacity; 1 truck access point; 1 building (the adjacent white building is a
  separate tenant); ~4.5 acres; not rail-served.

## Web findings
Sea Smoke Cellars, founded 1998 in Lompoc, is an estate Pinot Noir / Chardonnay
producer in the Sta. Rita Hills. Constellation Brands acquired Sea Smoke in May
2024; it is retained in the premium wine portfolio. The winery is not open for
public tastings — wines are pre-allocated to list members and the distributor —
so the site functions purely as a production-and-allocated-shipping facility.

## Final confidence
High. Facility positively re-located by direct address geocoding; building,
layout, and the absence of a controlled truck gate or guard shack confirmed via
Sep 2025 Street View and z20-z21 satellite. Only the exact service-door count is
marked uncertain.
