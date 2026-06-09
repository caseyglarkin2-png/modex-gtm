# Deep-Audit Dossier — Target Food Distribution Center, Denton TX (site #24)

- **Slug:** 24-food-distribution-center-denton
- **Type:** Food Distribution Center (refrigerated)
- **Address:** 3255 Airport Rd, Denton, TX 76207
- **Resolved center:** 33.19990, -97.18020
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high (guardShack call medium)

## Location confirmation
Geocoded input was 33.201667, -97.178575 — this lands on the Airport Rd / access-drive
junction, NOT on a building. Web research (CBS Texas, NBC DFW, chamber listings)
confirms the Target Food Distribution Center at **3255 Airport Rd** — a ~360,000 sq ft,
fully refrigerated/automated food DC near Denton Enterprise Airport serving 235 stores
in 8 states, ~140 employees.

The correct building is the large tan refrigerated warehouse **south of Airport Rd**,
centered ~33.1999, -97.1802. Positive confirmation came from Street View, which shows
the **Target bullseye logo** on the building façade (sv-gate-260, sv-checkpoint) and a
Target monument sign at the road (sv-road-at-entry, 2026-03). The map-provider pin
(33.2008, -97.1794) drops onto this same property's east apron, consistent with the
identification. The blue-roofed building to the SW and the white building NW are
separate neighbors and were excluded.

## What the key views showed
- **overview / context (z16-17):** Industrial park; the Target DC is a single large
  warehouse oriented slightly off-north, with employee parking to the north, a long
  dock bank + reefer trailers on the east face, and a drop yard east of the building.
- **target-full-z17 / perimeter-trace-z17:** Whole footprint — one big building, docks
  along the east wall, two long rows of trailers in a striped drop yard, refrigeration
  units along the south wall (confirms reefer DC).
- **east-access-z18 / throat-road-z20:** A single combined entrance drive leaves
  Airport Rd, splits to employee parking (W) and curves S down the east side to the
  truck yard. Deep approach — easily 3+ truck queue depth.
- **sv-checkpoint / sv-gate-240 / sv-gate-260 / sv-booth-285 (pano 2022-12):** A
  perimeter fence crosses the entrance drive with a **cantilever/swing vehicle gate**,
  and a **small white guard booth** sits beside the gate. The Target logo is visible on
  the building behind the gate.
- **yard-entry-z20 / checkpoint-z21:** Striped drop yard, two rows of 40+ reefer
  trailers backed in along the east dock bank.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** Perimeter fence with a controlled vehicle gate across the only
  entrance drive (Street View pano `kxxnsKTYgGxLwYeEvcPzhQ`, looking W/SW ~260-270°).
  The truck yard and parking are fully fenced.
- **guardShack = TRUE (medium conf).** A small white booth structure beside the gate is
  visible in Street View. The footprint and placement beside the controlled gate are
  consistent with a staffed guard shack at a high-security automated food DC. Camera
  distance prevents a 100% read, so it is flagged uncertain.
- **remoteGs = FALSE.** A physical guard booth is present, so this is not a
  kiosk/call-box-only entry.
- **dockDoors = 50+.** Long continuous bank of dock doors along the east building face
  with ~50-70 reefer trailers backed in (counted from z20/z21).
- **dropArea / dropYard = 50+ / TRUE.** Dedicated striped trailer-storage lot east of
  the building, two long rows, 40+ stalls separate from active dock staging.

## Yard zones & counts (estimates)
- perimeter: ~30.1 acres (traced inside the fence/property line).
- truckGate: rotated quad over the fenced gate crossing on the entrance drive.
- dropYards: one long quad over the east trailer-storage rows.
- dockAprons: one long thin quad over the east dock apron.
- streetViewMeta: perimeter pano `Oi9tpXmMCVgDstO6SY4uZQ` (heading 245°), truckGate pano
  `kxxnsKTYgGxLwYeEvcPzhQ` (heading 268°).
- dockDoorCount ~60; trailersVisible ~70; trailerParkingCapacity ~90; truckGateCount 1;
  buildingCount 1; railServed false.

## Web findings
- CBS Texas / NBC DFW: Target's most-advanced food DC; fully climate-controlled
  (freezer to -15°F), robotic, "banana rooms," serves 235 stores across 8 states.
- Chamber of Commerce: ~140 employees; hours 5:00 AM-6:00 PM daily.
- These corroborate a large, security-conscious refrigerated DC with heavy reefer
  trailer activity — consistent with the gated, drop-yard layout observed.

## Final confidence
**High** overall. Facility identity is unambiguous (Target logo on building + monument
sign). Gate and drop yard are clearly visible. The single soft call is whether the
gate-side structure is a staffed guard booth vs. an unmanned kiosk — rated medium and
flagged in uncertainFields; classified guardShack = true based on structure footprint
and placement at a major Target food DC.
