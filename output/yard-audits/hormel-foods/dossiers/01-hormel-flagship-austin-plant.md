# Deep-Audit Dossier — Hormel Flagship Austin Plant (Austin, MN)

**Roster idx:** 1
**Type:** Meat Processing Plant
**Resolved center:** 43.6765, -92.9665
**Confidence:** High

## Location resolution
The roster coordinates (43.68237, -92.968394, "ROOFTOP", address "1 Hormel
Place") point at the **Hormel World Headquarters / R&D campus** — a cluster of
multi-story office/lab buildings — not the production plant. Step-0 satellite
probing at z16-z17 around that point showed only office-scale buildings.

The actual **flagship Austin processing plant** (1.3M sq ft, ~1,900 employees,
SPAM / Cure 81 / bacon / pepperoni) is a sprawling industrial complex ~1.1 km
south, centered ~43.6765, -92.9665. Confirmed by: (a) z16-z17 satellite showing
a 10+ building manufacturing complex with dock banks and trailer yards;
(b) web research — the Hormel Austin Plant main gate is on 14th Ave NE
(CMac listing, phone 507-437-5293); (c) the Cedar River bounds the plant on the
west, 14th Ave NE / residential streets on the east, matching public records.

## Key views
- **z16/z17 overview** — large multi-building plant footprint spanning roughly
  43.671-43.681 N/S and -92.972 to -92.962 E/W. Cedar River on the west, rail
  line on the east, residential to the south and east.
- **SW satellite (z18)** — extensive trailer drop-yard rows and large employee
  parking lots.
- **Dock interface (z19)** — trailers backed against dock doors on the SW
  building face; multiple dock banks across building faces.
- **Driveway checkpoint (z20)** — a small (~1-vehicle footprint) guard-booth
  structure straddles the internal truck road at ~43.6740, -92.9665, with what
  reads as a barrier arm across the lane.
- **Street View (multiple headings, 2024-2026)** — the entire property is
  enclosed by chain-link fence with privacy slats on every street frontage
  (south, west, east). Open paved aprons feed the plant truck frontage.

## Gate / guard-shack / dock determinations
- **truckGate = true** — Fully fenced perimeter; an internal checkpoint with a
  guard booth and apparent barrier arm controls truck access. Web research
  explicitly references a "guarded gate for security clearance" at this plant.
- **guardShack = true** — Small multi-window booth straddling the truck lane at
  the internal checkpoint (visible at z20). Consistent with a major secured
  food plant.
- **remoteGs = false** — A staffed guard booth is present.
- **dockDoors = 50+** — Large multi-building food plant; trailers backed into
  dock doors on the SW face plus additional dock banks. Overhead estimate.
- **dropArea = 50+** — Extensive rows of parked trailers (no tractor) in the
  SW drop yard.
- **shipRcvSeparate = true** — Distinct dock clusters on different building
  faces.

## Yard zones and counts
- **Perimeter:** ~120 acres of fenced industrial property (river-edge land
  excluded from the working estimate).
- **Drop yards:** two zones — the large SW trailer-row lot and a secondary
  trailer area near the central dock apron.
- **Dock aprons:** SW building face and central-south building face.
- **Staging:** post-gate paved holding area between the checkpoint and docks.
- **yardMetrics:** ~60 dock doors, ~70 trailers visible, ~110 trailer
  capacity, 2 truck gates, ~12 buildings, rail-served.

## Web findings
- Hormel's largest plant: 1.3M sq ft, ~1,900 employees, 7 operating divisions,
  >1B lbs/yr, ~2,000 SKUs (SPAM family, Cure 81 ham, pepperoni, bacon).
- Includes hog-receiving operations (live-animal intake) — adds inbound truck
  volume and a likely truck scale.
- Main gate guarded; security clearance required for site access.

## Final confidence
**High.** Facility positively identified and corrected from the office-campus
coordinates. Gate and guard-shack supported by both imagery and web research.
`entryLanes`/`exitLanes`, the truck `scale`, and `multiStep` are honest
overhead estimates and flagged uncertain.
