# Crowley Folcroft Warehouse - Folcroft PA (idx 19)

**Address:** 1420 Delmar Drive, Folcroft, PA 19032
**Coordinates:** 39.898115, -75.272971 (ROOFTOP geocode)
**Type:** Warehouse / distribution facility (Crowley's Pennsylvania receiving location, operated with CMS Transportation Inc.)
**Confidence:** medium

## How it was confirmed
crowley.com/locations lists a Folcroft, PA "warehouse receiving location" at 1420 Delmar Drive (Crowley + CMS Transportation Inc., 610-586-4304). Geocoding the address lands ROOFTOP on a single large dark-roofed warehouse building. Satellite z17 -> z20 confirms an industrial warehouse with an adjacent unpaved drop yard, wedged into a residential block in Folcroft (Delaware County, ~8 mi SW of Center City Philadelphia). The rows of light-roofed buildings directly east across Delmar Drive are a self-storage facility, not part of the Crowley site - excluded from the geofence.

## What the imagery showed
- **z18/z19 overview:** One rectangular warehouse running roughly NW-SE, dark flat roof. A gravel/dirt drop yard sits on the NW side with a row of parked trailers/containers (~8 visible). A paved apron with a short dock bank is at the south/SE end of the building. Single-family homes border the lot to the east and south; a residential cul-de-sac is to the SW.
- **z20 building crop:** Confirms the warehouse footprint and roof detail; gravel yard to the west, paved apron to the south.
- **Street View (Delmar Dr panos, 2024-04):** Only the surrounding residential streets are covered. They show houses and a residential cul-de-sac, not a controlled truck entrance. The yard/dock side of the building is not Street-View accessible.

## Gate / guard / dock determinations
- **truckGate: false (uncertain).** No barrier arm, sliding gate, or guard booth resolved. Access appears to be an open driveway at the south/SE corner off Delmar Drive. Flagged uncertain because the operational (yard) side has no Street View coverage.
- **guardShack: false.** None visible. remoteGs false (no gate).
- **backupSensitive: true.** Lot is hemmed by homes and a residential cul-de-sac; tight maneuvering room and any truck queue would back onto a residential street.
- **dockDoors: 0-10 (~6).** Short dock bank on the south apron, partly shadowed by summer tree canopy - low confidence.
- **drivewayShort: true.** Short approach from Delmar Drive; holds only 1-2 trucks.

## Yard zones and counts
- **perimeter:** ~4.1 acres - whole fenced lot (warehouse + gravel drop yard), traced as a rotated quad at the building's NW-SE orientation.
- **dropYard:** the unpaved gravel yard NW of the building (~1.1 ac). dropArea band 10-25.
- **dockApron:** the south paved apron in front of the dock bank.
- **yardMetrics:** dockDoorCount 6, trailersVisible 8, trailerParkingCapacity 25, truckGateCount 1, buildingCount 1, siteAreaAcres 4.1, railServed false.
- **"yard spots" meaning:** TRAILER PARKING (not container slots). ~25 capacity is a conservative estimate for an unpaved, unstriped gravel lot - low confidence.

## Web findings
Listed as Crowley's PA warehouse/receiving location run with CMS Transportation Inc. Small infill industrial site, not a major DC. Crowley's larger Philadelphia-area marine facility is the separate Penn Terminals in Eddystone (idx 7), which is rail-served; this Folcroft site is not.

## Final confidence
**medium.** Building and address positively identified; yard footprint and drop-yard role are clear from overhead. Gate/guard and exact dock count are uncertain because the operational side of the lot has no Street View coverage and summer canopy obscures part of the apron.

**3-line summary**
- Gate: false (open driveway off Delmar Dr; no control visible - uncertain, yard side not SV-covered)
- Guard shack: false (none visible)
- Confidence: medium
