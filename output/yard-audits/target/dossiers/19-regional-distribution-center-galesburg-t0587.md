# Deep-Audit Dossier — Target RDC Galesburg (T0587)

- **Facility:** Target Regional Distribution Center Galesburg (T0587)
- **Type:** RDC (regional distribution center)
- **Address:** 12735 E L Ave, Galesburg, MI 49053
- **Resolved center:** 42.27620, -85.38230
- **Method:** deep-audit (satellite z15–z20 + Street View, June 2025 panos)
- **Confidence:** high

## Location confirmation
The geocoded point (42.275643, -85.381154) landed on the south employee
parking lot / building roof of the correct facility. Web search confirmed
12735 E L Ave as the Target Distribution Center T0587 (Target jobs pages,
OSHA inspection record, chamber-of-commerce listing). Satellite at z15–z16
shows a single very large white-roofed distribution building with a Target
bullseye on the south wall (visible in Street View), an L-shaped trailer yard
to the NW/N, an employee lot to the south, and a separate office building on
the SE parcel frontage. Setting is rural — farmland and woods, just south of
the I-94 corridor. True building center used: 42.2762, -85.3823.

## Key views
- **wide-z15 / corners-z16:** full footprint. One large rectangular DC, slightly
  rotated; L-shaped trailer drop yard + dock apron wrapping the NW/N; perimeter
  road around the east and north; employee lot south-center; separate
  office building to the SE.
- **north-dock-z18:** long continuous dock-door bank along the north building
  face with 40-50 trailers backed in (large dock apron).
- **east-access-z18 / se-booth-z19:** east building face has a second trailer
  row (east dock bank) along the perimeter road.
- **east-entrance-z19 + Street View (sv-east-entrance-n, sv-entrance-ne/nw):**
  the main truck entrance off E L Ave — a wide divided concrete apron with a
  Target monument sign, no barrier arm at the public road; the drive runs ~250 ft
  north toward the yard.
- **booth-closeup-z19 / booth-z20:** the guard booth — a small (~25-30 ft)
  standalone white gatehouse in the grass median at the SE entry to the
  trailer-yard perimeter road, with a paved pad/sidewalk and apron connecting
  to the road.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** A single controlled truck route feeds the yard: the wide
  divided entrance drive off E L Ave climbs north to the guard booth in the
  median, where the perimeter road pinches into the trailer/dock yard. The
  public-road mouth itself is open (landscaped), but the controlled checkpoint
  is the interior booth — a clear single point of yard control.
- **guardShack = TRUE.** Confirmed at 42.2752, -85.3789: a small single-structure
  booth (z20), not the main building, with its own paved pad and road apron,
  positioned to control the perimeter road into the trailer yard.
- **remoteGs = FALSE** — a physical staffed booth is present, so this is not a
  kiosk/app-only remote check-in.
- **dockDoors = 50+.** Continuous north-face dock bank (40-50 trailers backed in)
  plus a ~20-door east-face bank → well over 50 doors. Typical for a Target RDC.
- **dropArea / dropYard = 50+ / TRUE.** Large L-shaped trailer parking field
  on the NW/N holds 60+ bobtail trailers without tractors — a dedicated drop yard
  distinct from the active dock aprons.

## Other classification calls
- **postGateStaging = true:** large paved yard inside the booth before the docks.
- **drivewayLong = true:** ~250 ft deep approach from road to gate, holds 3+ trucks.
- **backupSensitive = false:** deep apron off a low-traffic rural road; no spillback risk.
- **entryExitTogether = true; entryLanes/exitLanes = 1/1** (single divided entrance;
  lane split low-confidence, flagged).
- **fastLaneOpportunity = true:** wide divided concrete apron with unused width.
- **shipRcvSeparate = true (medium):** two dock banks on different faces
  (north and east); door function not directly verifiable, flagged.
- **urbanRural = Rural:** farmland/woods setting, edge of small-town Galesburg.
- **multipleFacilities = false:** main DC dominates; the SE office is minor.
- **scale = false; multiStep = false; railServed = false** — no truck scale,
  no second checkpoint, no rail spur into the property.

## Yard zones & counts (from imagery)
- Perimeter: ~92 acres of fenced/maintained property (9-vertex ring tracing the
  paved/road edge; building is only slightly off-north).
- Truck gate: small quad over the booth + perimeter-road pinch.
- Drop yards: two rings over the north and west trailer fields.
- Dock aprons: two rings — long thin quads hugging the north and east dock walls.
- Metrics: ~90 dock doors, ~75 trailers visible, ~120 trailer capacity,
  1 truck gate, 2 buildings (DC + office), not rail-served.

## Street View coverage
Only the public road (E L Ave) has SV coverage; interior dock/yard panos resolve
back to the road. Best driver's-eye frame is the entrance pano
(~42.2746, -85.3781, June 2025) looking NW toward the booth/building —
recorded for both perimeter and truckGate (hasCoverage true, no interior pano).

## Web findings
- Confirmed operating Target RDC (T0587); ~24/7 warehouse operation per jobs
  listings (closed Wed; 24h Sun-Tue). General warehousing & storage.

## Final confidence: HIGH
Facility unambiguously identified; building, entrance, booth, docks, and drop
yard all read clearly from satellite + Street View. Lane counts and ship/receive
separation are the only soft calls (flagged in uncertainFields).
