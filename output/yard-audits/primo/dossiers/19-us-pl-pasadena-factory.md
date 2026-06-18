# US PL Pasadena Factory - Deep Audit Dossier

- **Facility:** US PL Pasadena Factory (Bottling plant / PL)
- **Operator:** BlueTriton / Primo Brands (Ozarka, Pure Life) - Pasadena, TX site; ~403,000 SF DC now operated/tenanted by Keller Logistics (3PL)
- **Address:** 2818 Pasadena Fwy, Pasadena, TX 77506
- **Resolved center:** 29.71020, -95.17450
- **Maps (sat):** https://www.google.com/maps/@29.71020,-95.17450,400m/data=!3m1!1e3
- **Method:** deep-audit (satellite z16-z20 + Street View) - **Confidence: HIGH**

## Location resolution
The supplied coordinates (29.5605, -95.1167) were ~17 km off, landing on apartment complexes and retail south of the city. A ROOFTOP geocode of the street address returned **29.7106063, -95.1750066**, which sits on a large modern white-roof distribution building fronting **TX-225 (Pasadena Freeway)**. Web search confirms 2818 Pasadena Fwy as the BlueTriton/Primo Ozarka/Pure Life Pasadena bottling-distribution address (LoopNet lists it as a ~403,066 SF industrial building, 2023; Keller Logistics lists a dedicated Pasadena site at this address). Center locked at the building footprint centroid, 29.71020, -95.17450.

## What the imagery showed
- **Setting (z16 context):** dense Houston-metro fabric - single-family residential street grid wraps the west and south property lines; the TX-225 petrochemical tank-farm / refinery corridor sits immediately north across the freeway. Clearly **Urban**; strong cellular, no connectivity issue.
- **Building (z17/z18):** one large rectangular DC, long axis roughly N-S (slightly canted), two-story glass office at the NE corner under a blue-roof canopy. A perimeter truck drive wraps the west, south, and east faces. Vacant grass buffer fills the east side of the parcel.
- **West face (z19/z20 west-apron crops):** the main dock bank - regular dock-leveler/bay rhythm runs nearly the full ~270 m wall, several trailers backed in, wide maneuvering apron with faint trailer-parking striping, and a narrow perimeter drive along the residential fence line.
- **South face (z19/z20 SW crop):** a second dock bank with a striped trailer-parking apron - reads as a drop/storage lot distinct from the active west staging.
- **North/NE (z18/z19/z20):** office + car-parking apron under the blue canopy; a smaller dock cluster; two driveways off the frontage road (NW = truck/dock entry, NE = office/main entry).

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE (high confidence).** Two open sweeping driveways connect to the TX-225 frontage road; neither has a barrier arm, sliding/swing gate, or perimeter fence. Street View along the frontage road (Feb 2025 panos + an Apr 2026 pano) shows open grass/landscaping straight to the building at both entrances - a classic open spec-DC layout.
- **Guard shack: FALSE (high confidence).** No booth-sized structure at either driveway in satellite or in the frontage Street View frames - only a monument sign near the NW entrance.
- **Remote gatehouse: FALSE.** No gate, so no kiosk/call-box check-in applies.
- **Docks: 25-50 band (~45 honest estimate).** Main bank along the full west wall + a second bank on the south face + a smaller north cluster. Sits near the 25-50 / 50+ boundary; banded down conservatively because white-roof glare at z20 softens the exact count.
- **Drop yard: TRUE; dropArea 10-25.** South apron is a dedicated striped trailer-storage lot; ~12 trailers actually parked at capture time (light occupancy), marked capacity ~15-25.
- **Ship/receive separate: TRUE (medium).** Docks on two physically separate faces (west + south) suggest split ship/receive; function unconfirmable from overhead.
- **Fast-lane opportunity: TRUE.** Very wide unused apron width and two ungated open entrances leave ample room to stripe an express check-in/bypass lane.

## Yard zones & counts (from tight imagery)
- Perimeter polygon traced inside the parcel line (~33 acres incl. east grass buffer).
- truckGate zone over the NW entry driveway; two open truck entrances counted.
- dropYard ring over the south striped apron.
- Two dockApron rings: long thin quad along the west wall + the south apron strip.
- Metrics: dockDoorCount ~45, trailersVisible ~12, trailerParkingCapacity ~40, truckGateCount 2, buildingCount 1, siteAreaAcres ~33, railServed false.
- Street View: coverage exists ONLY on the TX-225 frontage road. truckGate uses frontage pano `qMZutJBia99-4g-P234Cqw` (Apr 2026), heading ~172 deg into the NW entrance. Interior/west/south centroids return ZERO_RESULTS - perimeter streetViewMeta hasCoverage:false.

## Web findings
- 2818 Pasadena Fwy = BlueTriton/Primo Ozarka & Pure Life Pasadena facility (Birdeye/Wikipedia BlueTriton-brands references); the building itself is a ~403,066 SF 2023 industrial DC (LoopNet/Showcase/Crexi) now associated with Keller Logistics' dedicated Pasadena 3PL site.
- Pasadena/Deer Park is a heavy petrochemical industrial corridor (tank farms visible north of TX-225).

## Confidence
**HIGH.** Building positively identified by rooftop geocode + corroborating web sources; gate/guard-shack verdicts confirmed by multiple Street View frames; dock band is the main soft spot (roof glare), flagged in uncertainFields.
