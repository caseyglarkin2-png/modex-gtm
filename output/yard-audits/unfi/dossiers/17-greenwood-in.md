# UNFI — Greenwood IN DC (Indianapolis) — Deep Audit (idx 17)

**Resolved location:** 655 Commerce Pkwy E Dr, Greenwood, IN 46143 — center ~39.61015, -86.05775
**Confidence:** High

## Location confirmation
The roster coordinate (39.61008, -86.057658) lands directly on a large
single-story distribution building in a Greenwood (Indianapolis-metro)
industrial park. Street View along the west road (Commerce Pkwy E Dr) shows a
clear **"unfi"** wall sign on the building, confirming identity. Imagery is
2025-vintage Street View and 2026 Maxar satellite.

**Active-status note:** the roster flagged that some directories list Greenwood
as closed (one Yellow Pages listing reads "CLOSED"). However, the May-2025
Street View shows the UNFI sign in place, tractors and trailers actively parked
in the yard, and the lot in use; a Yelp listing was "Updated March 2026." The
facility presents as operational in current imagery. The closed-listing is
treated as stale directory data, but worth a one-line verification in discovery.

## Layout
A single large DC building, long axis running roughly N-S. Loading docks line
**three faces** — the west, the east, and the north end — all with regular
dock-door rhythm and trailers backed in. The south face is a 3-story office
block with employee parking and a separate paved vehicle pad (driver
training / overflow). The property is bounded on the east by a residential
subdivision (thin tree buffer only) and on the west by Commerce Pkwy E Dr.

## Gate / guard-shack determination
- **Truck entrance:** mid-to-north on the west side, off Commerce Pkwy E Dr.
  Street View (heading ~60-90°) shows a wide paved curb-cut with yellow
  bollards flanking it, opening directly onto the truck yard.
- **No barrier arm. No sliding/swing gate across the truck lane. No guard
  booth.** The driveway is an open, uncontrolled entrance. A black ornamental
  fence + hedge runs along the road frontage past the office, but the truck
  driveway itself has no checkpoint structure.
- Verdict: **truckGate = false, guardShack = false, remoteGs = false** —
  archetype #3 (No Gate / No GS).

## Yard zones & counts
- **Perimeter:** ~23.5 acres enclosing the building, all three dock yards, and
  the office/parking apron.
- **Dock doors:** dense banks on west, east and north faces — estimate ~95
  doors total (50+ band).
- **Drop yard:** long rows of unhitched trailers staged on the west, east and
  north yards — clearly a dedicated drop-yard operation (50+ band).
- **Trailers visible:** ~110 in captured imagery; capacity ~130.
- **Internal staging:** generous paved yard between the entrance and the dock
  faces — postGateStaging true; the gate→dock approach easily holds 3+ trucks
  (drivewayLong).
- No truck scale, no rail spur, single building.

## Web findings
UNFI Greenwood is a legacy-SuperValu-era Central-region distribution center
serving the Indianapolis market. Listed across business directories at 655
Commerce Parkway East Dr; one directory carries a "closed" flag consistent with
UNFI's ongoing Central-region consolidation cadence — current imagery shows it
still active. Phone (317) 865-7140.

## Final confidence
**High.** Building positively identified by UNFI signage; gate verdict is
unambiguous from multiple Street View passes (open driveway, no gate, no
booth). Dock-door and trailer counts are honest overhead estimates and flagged
as uncertain. The only soft point is the conflicting "closed" directory listing
vs. the active appearance in 2025/2026 imagery.
