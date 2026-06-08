# GM CCA - Fort Worth Parts Distribution Center (Roanoke, TX) - Deep Audit

**Facility:** GM Customer Care & Aftersales (CCA) Parts Distribution Center
**Address:** 301 Freedom Drive, Roanoke, TX 76262 (AllianceTexas logistics district, NE of Fort Worth)
**Resolved center:** 32.99887, -97.24617
**Maps:** https://www.google.com/maps/@32.99887,-97.24617,400m/data=!3m1!1e3
**Confidence:** medium

## How the location was confirmed
- Web research resolved the "GM CCA - Fort Worth PDC" to 301 Freedom Dr, Roanoke TX (Fort Worth metro). GM lists a Fort Worth Parts Distribution Center; local/permit records (Community Impact, TDLR) place it at 301 Freedom Dr.
- Google geocode returned a ROOFTOP match for "301 Freedom Dr, Roanoke, TX 76262" at 32.9988714, -97.2461682, landing dead-center on a large rectangular warehouse.
- Building characteristics match a GM PDC: ~404,000 sq ft single-building warehouse opened 2001, UAW Local 816 staffed; a 2024 TDLR-permitted ~$2.25M renovation added **truck storage and paving, striping, lighting and a storm-sewer connection** - consistent with the trailer-storage yard visible on the west side.

## What the key views showed
- **Wide / overview (z16-17):** Long warehouse oriented roughly N-S, rotated ~10 deg clockwise, sitting in a dense AllianceTexas warehouse district with large neighboring DCs on all sides. Water tower at the SW corner, employee parking + a trailer staging row at the north, perimeter access road and grass buffer to the west, N-S access road to the east, and an E-W rail line along the south.
- **West dock face (z19):** A long continuous loading-dock bank runs the full west wall with a near-solid row of trailers backed in and a wide dock apron in front. This is the primary truck face.
- **North end (z19-20):** Employee/visitor parking lot and an office front (white facade with window bays), plus a trailer staging strip along the north access drive.
- **SW / rail (z19):** The E-W through track along the south boundary throws a spur that curves north up the west side of the building - rail-served.
- **Street View (Freedom Dr, 2024-12):** The west property frontage is a landscaped grass buffer with a low perimeter wall/fence behind the tree line; a GM site sign sits at the south. No open curb cut into the dock yard from this stretch. A second pano (2023-11) sits inside the NW employee/office lot, confirming the office front of the building.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The property is enclosed (perimeter wall/fence visible behind the Freedom Dr tree buffer) and the truck yard is reached through a single controlled entry corridor on the NW off the access-road network - no uncontrolled public-road entry into the dock yard.
- **guardShack = false (uncertain).** No staffed booth is resolvable in satellite, and Street View coverage misses the truck gate (it covers Freedom Dr to the east and the interior office lot). Flagged uncertain.
- **remoteGs = true (low confidence).** Controlled fenced entry with no visible manned booth implies kiosk / remote / app check-in.
- **dockDoors = "25-50".** Long continuous dock-door bank on the west face with ~30 trailers/doors counted across the tight crops.
- **dropArea = "25-50" / dropYard = true.** Trailer-storage lanes along the west yard plus a north staging strip; ~30 trailers visible, room for ~50. The 2024 renovation explicitly added truck storage.
- **shipRcvSeparate = false.** Docks concentrated on one (west) building face.

## Yard zones and counts measured
- **perimeter:** ~20 acres (traced ring covering the building, west dock yard, north parking and east access strip).
- **truckGate:** NW entry corridor quad aligned to the access drive.
- **dropYards:** one long ring hugging the west dock yard / trailer-storage lanes at the building's angle.
- **dockAprons:** one long thin ring along the west dock wall.
- **yardMetrics:** dockDoorCount 32, trailersVisible 30, trailerParkingCapacity ~50, truckGateCount 1, buildingCount 1, siteAreaAcres 20, railServed true.
- **streetViewMeta:** perimeter pano yfHQpkluMWYhOQY6Axpl0A (heading 235, Freedom Dr); truckGate pano VF1RgYzst7vJSJufP56gcA (heading 141, NW lot).

## Web findings
- GM Fort Worth Parts Distribution Center: ~404,000 sq ft, opened 2001, automotive service-parts distribution for GM, UAW Local 816.
- 2024: ~$2.25M TDLR-permitted renovation adding truck storage, paving/striping/lighting and a storm-sewer connection (completion targeted Oct 2025).

## Final confidence
**Medium.** Building identity and location are positively confirmed (rooftop geocode + footprint + corroborating records), and the dock face, trailer yard and rail spur are clear. Gate/guard-shack specifics are limited by Street View coverage that does not reach the truck gate, so guardShack/remoteGs and lane counts are flagged uncertain.
