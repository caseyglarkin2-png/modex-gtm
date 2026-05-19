# General Mills - Belvidere IL Distribution Center (idx 8)

## Resolved location
- **Roster coords were wrong.** The roster pin (42.26391, -88.844267, geocode precision APPROXIMATE) sits in a residential neighborhood in central Belvidere — no industrial building there.
- Web research (WIFR, Belvidere Chamber of Commerce, Growth Dimensions, REJournals) places the DC at **1210 Irene Rd**, on a **111-acre** parcel at the realigned **Irene Rd / U.S. Route 20** intersection on the SW industrial fringe of Belvidere.
- Probed satellite SW of the city; found a large new white warehouse just north of US-20. **Locked center 42.2440, -88.8975.**
- The facility is a **1.3M sq ft** state-of-the-art, fully automated Midwest distribution hub that opened **April 2024** (first fully automated DC in General Mills history; ~45 automated machines, 55-75 employees).

## Key views
- **z16/z17 satellite:** A single large rectangular warehouse oriented NW-SE. Dock face runs the full **NE-facing wall**; the SW wall is a blank face. Surrounding yard is bare-dirt — imagery is mid-construction.
- **z18 NE dock face:** A long continuous bank of dock doors with many trailers backed in, plus a separate row of perpendicular-parked trailers (a drop row) in the NE yard.
- **2025-08 Street View (Irene Rd):** Confirms the completed building with blue dock doors along the NE/E face. The pano is on the public realigned Irene Rd; the access driveway curves NE off US-20 into the property's NW corner. Street View does not extend onto the private driveway.

## Gate / guard-shack / dock determinations
- **truckGate: true** — A single private access road leaves US-20 at a signalized intersection and curves into the NW corner of the property. Treated as a controlled truck entrance for a new, large automated DC. Satellite imagery is construction-era so no gate structure is yet visible. Flagged.
- **guardShack: false / remoteGs: true** — No staffed booth visible. Construction-era satellite and public-road-only Street View leave the entrance check-in unconfirmed; defaulted to remote check-in (kiosk/app), consistent with a highly automated facility. Both flagged uncertain.
- **dockDoors: 50+** — Single long dock bank on the NE wall, roughly 50-70 dock positions.
- **dropArea: 10-25 / dropYard: true** — A perpendicular trailer-parking row in the NE yard, separate from the active dock apron.
- **shipRcvSeparate: false** — All docks on one face.
- **drivewayLong: true, fastLaneOpportunity: true** — Long curving approach from US-20; wide entry apron with undeveloped paved width for a bypass lane.

## Yard zones and counts
- **perimeter:** ~113 acres (matches reported 111-acre parcel).
- **truckGate:** NW-corner entry apron.
- **dropYards:** one trailer row in the NE yard.
- **dockAprons:** one long apron along the NE dock face.
- **yardMetrics:** dockDoorCount ~60, trailersVisible ~45, capacity ~70, 1 building, 1 truck gate, not rail-served.

## Web findings
- 1.3M sq ft, 111 acres, opened April 2024; first fully automated DC for General Mills; Irene Rd realigned for semi-truck access; ~55-75 permanent jobs.

## Final confidence
**Medium.** Building identity, scale, layout, and dock face are clear and corroborated. Satellite imagery is mid-construction so the gate structure, guard arrangement, and exact lane/trailer counts could not be visually confirmed — those fields are flagged.
