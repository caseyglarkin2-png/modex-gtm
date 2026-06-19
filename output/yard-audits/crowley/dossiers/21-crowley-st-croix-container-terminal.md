# Crowley St. Croix Container Terminal — Deep-Audit Dossier

**Facility:** Crowley Caribbean Services container operation at the Wilfred "Bomba" Allick Port & Transshipment Center ("The Containerport"), St. Croix, U.S. Virgin Islands
**Type:** Marine / container terminal (multipurpose, Ro-Ro + Lo-Lo)
**Resolved coords:** 17.6943, -64.7616
**Confidence:** LOW (moderate-res island imagery; lightly used yard)
**Maps:** https://www.google.com/maps/@17.694300,-64.761600,400m/data=!3m1!1e3

## Location resolution
The mailing city is Christiansted (00823), but the terminal is **not** in or near downtown Christiansted. Crowley's St. Croix container service runs out of VIPA's Wilfred "Bomba" Allick Port on the **south shore**, at the mouth of the dredged **Krause Lagoon** channel, immediately **west of the former HOVENSA / Limetree Bay refinery** tank farm and its product/tanker piers.

Confirmation path: web research (VIPA / viport.com, St. Croix Source) gave the description — ~45-acre VIPA parcel beside the former HOVENSA refinery and the Gordon A. Finch Molasses Pier, 1,000 ft dock, 2 berths (vessels to 525 ft / 30 ft draft), Ro-Ro + Lo-Lo, 30-ton gantry crane. Satellite probing distinguished the refinery's long finger oil/tanker piers (with pipelines, a docked tanker) from the **dedicated container wharf**: a solid marginal quay with an upland paved working yard, a transit shed, and bulk tanks, sitting at the SW corner of the industrial zone at the channel mouth. Crowley and Tropical Shipping are the two long-time carrier tenants; VIPA owns the port.

## What the imagery showed
- **z15–z17 wide:** the refinery tank farm dominates the south coast; its two east finger piers are oil/tanker berths (one tanker docked). The container terminal is the separate developed wharf at the SW channel mouth.
- **z18 footprint (17.6943, -64.7618):** large flat **white-roofed transit shed** (center-top), a **paved container working yard** south/east of it, three **bulk storage tanks** (NW), a **marginal wharf/quay** running NW–SE along the SW edge with a **small barge docked** at the NW corner, and a **rubble breakwater** extending SE into the reef. The yard is lightly used — sparse stacks, encroaching vegetation on the paved surface.
- **z19:** wharf and yard confirmed; effectively empty of organized container stacks in this capture.

## Gate / guard determination (key evidence)
**Street View exists** (south-shore access road, captured 2016-08, pano @ 17.6955, -64.7626):
- Looking S/SE toward the terminal: a **chain-link perimeter fence with a swing gate across the road**, plus a **security / RANGER pickup truck and a person standing** at the checkpoint — a **manned controlled entry**.
- A 2024 capture along the same road shows the **chain-link fence around the tank/yard perimeter** intact.
- Other headings show gravel road and dense coastal scrub — a remote, undeveloped approach.

Verdict: **truckGate = true** (fence + swing gate + manned check). No fixed glass guard **booth** resolved, so **guardShack = false / remoteGs = true** (manned/kiosk-style control). Single entrance, entry and exit together. Long internal approach off a quiet industrial road → **drivewayLong = true**, **postGateStaging = true**, **backupSensitive = false**.

## Yard zones & counts (conservative)
- **Perimeter:** ~12-acre active paved working-yard + wharf footprint traced as a 9-vertex ring (the wider VIPA parcel includes adjacent scrub/laydown not in active container use; site area reported ~12 acres for the active footprint).
- **dropYard:** the paved laydown south/east of the transit shed (one ring).
- **dockAprons:** none (no dock-door bank — marine wharf only).
- **yardMetrics:** dockDoorCount **0**; trailersVisible **0** (none organized in capture); **trailerParkingCapacity ~400 container ground slots** (conservative range 300–500, theoretical capacity of the paved yard — live utilization is far lower); truckGateCount 1; buildingCount 2 (transit shed + tank cluster); siteAreaAcres ~12; railServed **false** (no rail on St. Croix).

## Classification highlights
- dockDoors **NONE**, dropArea **25-50**, dropYard **true** (marine container terminal — slots, not docks).
- urbanRural **Rural**; connectivityIssue **true** (inferred — remote south coast far from towns).
- scale uncertain (none visible); shipRcvSeparate false; multipleFacilities false; multiStep false.

## Web findings
- VIPA "The Containerport": 45-acre parcel, 1,000 ft dock, 2 berths to 525 ft / 30 ft draft, Ro-Ro + Lo-Lo, 30-ton gantry. Next to former HOVENSA/Limetree Bay and the Gordon A. Finch Molasses Pier.
- Crowley + Tropical Shipping are the two long-time cargo carriers serving the USVI; both renew terminal contracts with VIPA. A 2021 VIPA/Tropical/Crowley grant partnership aimed at cargo-port infrastructure improvements.

## Final confidence
**LOW** — location and gate are well established (good Street View at the entrance), but the container-slot capacity, exact gate structure (booth vs manned gate), scale, and building count are estimates from moderate-resolution, lightly-used island imagery.
