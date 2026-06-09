# Deep-Audit Dossier — Kroger Customer Fulfillment Center, Pleasant Prairie WI

- **Facility:** Kroger Customer Fulfillment Center (Ocado-automated)
- **Address:** 9091 88th Ave, Pleasant Prairie, WI 53158
- **Resolved center:** 42.54320, -87.91120
- **Method:** deep-audit (satellite probe.ts + Street View + web research)
- **Confidence:** high

## Step 0 — Locating and confirming the facility

The supplied approximate coordinates (42.542574, -87.912278) landed at the south
end of the correct building. Web research confirmed 9091 88th Ave as the Kroger
Co. / Ocado Customer Fulfillment Center — a 336,840 sq ft high-tech automated
grocery fulfillment center that opened June 28, 2022 (Kroger IR / Supermarket
News / BizTimes). Kroger's own store locator lists the site at 9091 88th Ave,
Pleasant Prairie.

Care was needed because a **much larger dark-roofed distribution building sits
immediately north** of the CFC on the same road; it is a separate, bigger
facility (700K+ sq ft footprint with its own large trailer drop yard). The CFC
is the **central white-roofed building** — its footprint matches the published
~337K sq ft and the approximate coordinates. Locked center at 42.5432, -87.9112.
The building's long axis runs NW-SE, rotated roughly 25-30 degrees off north, so
all geofence quads are rotated to match.

## Key views

- **Wide z16/z17 satellite:** CFC building center, surrounded W by 88th Ave and
  farmland, N by a trailer/van drop band, E by a retention pond, S by a large
  employee car lot. A rail/utility corridor runs diagonally NE of the property
  but **no spur enters the site**.
- **NE building face (z19/z20):** inbound grocery semi-trailers backed into dock
  doors along the face fronting the pond; open yard east of it stages additional
  trailers and vans.
- **SW building face + NW lot (z20):** an extensive fleet of branded **Kroger
  Delivery vans** parked in herringbone rows — the last-mile outbound side of a
  CFC. Vans load from the SW face and stage in the NW lot.
- **Entrance (z20/z21):** single main driveway off 88th Ave (~42.5430,-87.9128);
  it pinches to a marked entry island with crosswalks where it crosses the fence.
- **Street View (2023-08, pano 4lBrj3cqf4vydod_hPEw3Q @ 42.54294,-87.91334):**
  continuous chain-link perimeter fence the full length of the 88th Ave frontage;
  building front, office, and employee lot visible behind a landscaped berm.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Single controlled entrance off 88th Ave. Whole property
  is ringed by chain-link fence (multiple Street View frames). The access drive
  necks down to a marked entry island where it pierces the fence line — a clear
  checkpoint pinch-point, not an open driveway.
- **guardShack = false / remoteGs = true.** No manned guard booth is clearly
  resolvable at the entry island in z21 satellite; a small control island/pad
  sits in the throat. For a heavily automated Ocado CFC, kiosk/app check-in is
  the expected pattern, so remoteGs = true. Both flagged uncertain.
- **Docks = 50+.** Doors split across two faces: inbound semi docks on the NE
  face (by the pond) and a large delivery-van loading bank on the SW face.
  Combined estimate ~60 doors; van bays are smaller and partly occluded, so the
  count is approximate (flagged).
- **shipRcvSeparate = true.** Inbound semis (NE face) and outbound vans (SW face
  + NW staging lot) run from physically separate clusters on different faces.

## Yard zones and counts

- **perimeter:** fenced property, 6-vertex rotated polygon, ~42 acres.
- **dropYards (2):** NW van-fleet lot (dozens of branded delivery vans) and a
  trailer band north of the building.
- **dockAprons (2):** NE semi-dock apron (rotated to the pond-facing wall) and
  the SW van-loading apron.
- **staging:** post-gate paved holding area between the entry island and the
  building/parking split.
- **yardMetrics:** dockDoorCount ~60, trailersVisible ~30 (semis + the
  van-trailer mix), trailerParkingCapacity ~45, truckGateCount 1, buildingCount
  1, siteAreaAcres ~42, railServed false.

## Web findings

- 336,840 sq ft Ocado-powered CFC; opened June 28, 2022; serves WI, northern IL,
  and NW Indiana; initially ~250 jobs scaling toward 400-700.
- Note: Kroger announced it would **close** three Ocado CFCs including Pleasant
  Prairie as it restructures e-commerce. Physical yard layout audited here is
  from the most recent imagery and remains valid for modeling purposes.

## Final confidence: high

Facility unambiguously identified and imagery is clear. Uncertain fields:
guardShack / remoteGs (no resolvable manned booth), dockDoorCount (van-bay
occlusion), shipRcvSeparate (inferred from two-face dock split).

Sources: Kroger IR (ir.kroger.com), Supermarket News, BizTimes, PR Newswire,
Kroger store locator.
