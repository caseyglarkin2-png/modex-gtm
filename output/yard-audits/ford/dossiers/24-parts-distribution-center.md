# Ford - Parts Distribution Center, Rancho Cucamonga CA — Deep Audit

## Resolved location
- Roster coords (34.099865, -117.551907) are ROOFTOP-accurate and land on the correct
  building — a large solar-roofed cross-dock warehouse on Milliken Ave.
- Web research confirms **8449 Milliken Ave, Rancho Cucamonga, CA 91730** — a ~449,370
  sq ft warehouse/distribution building (completed 2000, "Prologis Rancho Cucamonga
  Distribution Center"), leased by Ford as its West Coast Parts Distribution Center.
- **Locked center: 34.09990, -117.55250.**

## Key views
- **Wide satellite (z16-18):** Dense Inland Empire logistics district. The Ford PDC is
  the solar-roofed cross-dock building; a second large warehouse sits immediately to
  the north with a shared truck yard between them.
- **South face (z19):** Long continuous dock-door bank with many trailers backed in
  (orange, white, blue, green); a trailer drop yard in front; a driveway entrance from
  the Milliken Ave arterial.
- **North face (z19):** Second dock-door bank facing the shared truck yard between the
  two buildings — confirming a true cross-dock layout.
- **Office entrance (Street View 2025):** A sliding gate across the office/main
  driveway; building set behind heavy landscaping.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Modern secured cross-dock facility. The office driveway has a
  visible sliding gate (2025 Street View); the north and south truck yards are
  fenced/walled with controlled driveway entrances off the arterial.
- **guardShack = false (low confidence).** No staffed guard booth visible at the
  driveway entrances in Street View — gated but unmanned-appearing. Flagged uncertain.
- **remoteGs = true (low confidence).** Controlled gates without a confirmed booth.
- **dockDoors = "50+".** Continuous dock-door banks on BOTH the north and south
  building faces with many trailers backed in; ~70 estimated.
- **dropArea = "25-50".** Trailer parking in both the south yard and the shared north
  yard; ~55 trailers visible (borderline 50+; called 25-50 conservatively).
- **dropYard = true.** Dedicated trailer-parking lots on both sides of the building.
- **shipRcvSeparate = true / entryExitSeparate = true.** True cross-dock building with
  physically separate north and south dock faces and separate truck yards/driveways.
- **railServed = false.** No rail spur — truck-served logistics district.

## Yard zones / counts
- Perimeter: ~28 acres (the ~449k sq ft building and its two yards).
- Two drop-yard boxes (south yard, north shared yard), two dock-apron strips, one
  staging area.
- Building: 1 (the leased ~449k sq ft cross-dock warehouse).

## Web findings
- ~449,370 sq ft warehouse/distribution building, completed 2000; multi-tenant
  industrial; Ford operates its West Coast parts distribution center here.

## Confidence: HIGH
Facility positively identified (ROOFTOP geocode + web confirmation), cross-dock layout
and dock/drop counts clear. Guard-booth and exact lane counts are low-confidence
(flagged) — Street View shows the gated entrances but no booth interior.
