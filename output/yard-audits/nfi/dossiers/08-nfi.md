# Deep-Audit Dossier — NFI Distribution Center, Ontario CA (site 08)

## Resolved location
- **Audited building:** 1990 S Cucamonga Ave, Ontario, CA 91761 (cross street E Francis St)
- **Center coords:** `34.039350, -117.633900`
- **Maps (satellite):** https://www.google.com/maps/@34.039350,-117.633900,400m/data=!3m1!1e3

### How the location was confirmed (Step 0)
The supplied coordinates `34.055371, -117.727269` and the dossier address "1450 E Mission Blvd, Ontario CA 91761" are a **misgeocode**. Google's geocoder resolves "1450 E Mission Blvd" to **Pomona, CA 91766** (ROOFTOP) at exactly the supplied lat/lng — Mission Blvd is a long arterial that straddles Pomona and Ontario. Street View at that point shows a small retail strip ("Marine," "Custom Kitchen Cabinets"), not an NFI DC. A component-filtered geocode for the same address in Ontario 91761 returned **zero results**, confirming the corporate address does not place a building in Ontario.

Geocoding "NFI Distribution, Ontario CA" instead returned a real Inland Empire DC, which reverse-geocodes to **1990 S Cucamonga Ave, Ontario CA 91761**. Satellite confirms a large modern cross-dock warehouse with a long west-face dock line, trailer yard, and guarded entrance. **Street View from E Francis St shows NFI-branded blue tractors parked at and queued into the entrance**, positively identifying the operator. This is the operational Inland Empire DC the researchHint asked us to confirm ("the industrial DC building, not an office"). The D&B 168,361 sqft / 10.76-acre figure belongs to the separate "1450 E Mission" corporate/leasing record; the operational building here is materially larger (~560k sqft footprint).

## Key views
- **Overview (z16/z17):** Dense Inland Empire industrial district. The NFI building is a single large rectangle, long axis running NNW–SSE (tilted ~6° from true north), fronting E Francis St on the north and S Cucamonga Ave on the east.
- **East face (Cucamonga Ave):** Blank tilt-up wall with landscaped setback — no docks. Street View confirms a clean windowless frontage.
- **West face:** One continuous loading-dock line running the full ~345 m wall, dozens of trailers backed in, with a paved truck court and a trailer drop strip beyond it.
- **North end (Francis St):** Office + employee/visitor auto parking at the NE corner; the truck court entrance is at the NW.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** The truck entrance is at the NW, off E Francis St. Tight z21 satellite shows a barrier line across the drive throat with a gatehouse island; the drive pinches and splits around it. Street View (Francis St, facing south) shows the landscaped entry median, an "authorized/do-not-enter" sign, and NFI tractors and box trailers staged at the throat — a clearly controlled entrance.
- **guardShack = TRUE.** A small white ~1-vehicle-footprint booth sits on a median island in the middle of the entry drive (z21), with a lane on each side. Classic gatehouse.
- **remoteGs = FALSE** (a staffed booth is present).
- **entryExitTogether = TRUE / entryLanes 1 / exitLanes 1.** Single gate point; lanes split in/out around the booth island.
- **postGateStaging = TRUE, drivewayLong = TRUE.** The truck court inside the gate is wide and runs the full building length — easily holds a 3+ truck queue before the dock line.
- **backupSensitive = FALSE.** E Francis St is a low-traffic industrial street and there is deep internal stacking, so a queue would not spill onto the public road.
- **dockDoors = "50+".** Continuous dock rhythm with trailers backed in along the entire west wall; far exceeds 50 doors. Exact count not resolvable from overhead — flagged uncertain.
- **shipRcvSeparate = FALSE.** All docks on one (west) face.
- **scale = FALSE, multiStep = FALSE.** No weigh pad or second checkpoint visible.

## Yard zones & counts (measured)
- **perimeter:** 4-vertex ring tracing the fenced property (building + east landscape buffer to Cucamonga + west truck court/drop yard), oriented to the building's tilt. **≈ 13.7 acres.**
- **truckGate:** small rotated quad over the NW entry throat/booth.
- **dockApron:** thin quad (~1.8 ac) hugging the west dock wall at the building's angle.
- **dropYard:** one ring (~1.7 ac) over the trailer-storage strip west of the apron → `dropYard = TRUE`, `dropArea "25-50"`.
- **staging:** null (no distinct pre-gate apron beyond the entry throat).
- **yardMetrics:** dockDoorCount ~80 (est.), trailersVisible ~70, trailerParkingCapacity ~45, truckGateCount 1, buildingCount 1, siteAreaAcres 13.7, railServed false. Counts are honest overhead estimates and are flagged in `uncertainFields`.

## Street View metadata
- **truckGate:** pano `9sdJy8zNwdwS5Nj3-wyyuQ` (E Francis St, 2025-08), heading 181° — looks south into the gated truck entrance with NFI tractors. This is the driver's-arrival frame.
- **perimeter:** pano `ossBCthVBjdMyX3SQEzHog` (S Cucamonga Ave, 2025-08), heading 264° — looks west at the building's east frontage.
- West truck court and dock face have no Street View coverage (private property).

## Web findings
- D&B lists NFI Industries, Inc. at 1450 E Mission Blvd, Ontario CA 91761-2145 (corporate/leasing record; 168,361 sqft / 10.76 ac listed for lease via LoopNet/Crexi). APN 0113-431-07.
- NFI also operates a separate 760,829 sqft warehouse at 13000 Mission Blvd near Ontario Int'l Airport (not this site).
- "NFI Distribution, Ontario CA" maps to 1990 S Cucamonga Ave — the operational DC audited here.
- Setting: dense Inland Empire logistics fabric → **urbanRural = Urban**, **connectivityIssue = FALSE**.

## Final confidence: HIGH
Building identity (NFI), gate, and guard shack are all directly confirmed in imagery (NFI tractors + gatehouse booth + barrier). Only the precise dock-door and trailer counts are estimates, flagged in `uncertainFields`.
