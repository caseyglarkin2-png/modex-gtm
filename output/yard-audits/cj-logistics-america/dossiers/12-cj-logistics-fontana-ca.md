# Deep-Audit Dossier — CJ Logistics, Fontana CA (idx 12)

## Facility
- **Name:** CJ Logistics - Fontana CA
- **Type:** Distribution Center
- **Address:** 13204 Jurupa Avenue, Fontana, CA 92337
- **Resolved coordinates:** 34.049300, -117.517400 (building center)

## Step 0 — Location confirmation
The geocoded roster point (34.049016, -117.517479, ROOFTOP, moved 121m) landed
on a gray-roof distribution building in the dense Fontana / Inland Empire
warehouse district. Web search (Waze, Racklify, Yellowpages, FSIS) confirmed CJ
Logistics America operates at 13204 Jurupa Ave (Racklify lists 250,430 sq ft).
Correct building positively identified.

## Key views
- **z16 context:** Dense warehouse district — large distribution buildings on
  every side; a flood-control channel and powerline corridor border the east.
- **z17/z18:** Mid-size gray-roof DC; office at the south-center, employee
  parking on the south side, a large open paved truck yard on the east side.
- **z19 east face:** Dock door bank on the east face fronting the truck yard;
  colorful trailers (green/blue/pink) parked along the dock and in the yard.
- **2023-2025 Street View (Jurupa Ave):** The east truck yard is enclosed by
  chain-link fence; building beyond, trailers parked in the yard; a monument
  sign at the SE corner.
- **z20-z21 entrance:** A single wide driveway opening off Jurupa Ave at the SE
  corner serves the fenced truck yard; no guard booth visible.

## Gate / guard-shack / dock determinations
- **truckGate: TRUE (medium confidence)** — The large east-side truck yard is a
  chain-link-fenced enclosure (confirmed in multiple Street Views) with a single
  wide driveway opening off Jurupa Ave — a controlled fenced enclosure with one
  pinch-point entrance. A sliding gate at the opening is implied by the
  perimeter fence but could not be positively resolved in imagery.
- **guardShack: FALSE** — No guard booth structure at the truck-yard entrance in
  z21 satellite or Street View.
- **remoteGs: TRUE** — A fenced/controlled truck-yard entrance with no guard
  booth implies kiosk / app check-in.
- **dockDoors: 25-50** — Dock bank on the east face (~35-40 doors) plus a small
  SW dock area; ~45 doors total estimated.
- **shipRcvSeparate: TRUE** — Main east-face dock cluster plus a separate
  smaller SW-face dock area.

## Yard zones & counts
- **Perimeter:** Building, east truck yard, and south parking, ~323m x ~369m,
  estimated ~29 acres.
- **Truck gate zone:** SE-corner fenced driveway opening off Jurupa Ave.
- **Drop yard / staging:** The fenced east truck yard serves as a dedicated
  trailer-storage / staging lot — large but lightly occupied in 2026 imagery.
- **Dock aprons:** East-face apron (main) and SW-face apron (small).
- **Metrics:** ~45 dock doors; ~14 trailers visible; ~80 trailer-yard capacity;
  1 truck gate; 1 building; ~29 acres; no rail.

## Web findings
- CJ Logistics America 3PL/fulfillment DC at 13204 Jurupa Ave, Fontana CA 92337
  (Waze, Racklify, Yellowpages); Racklify lists 250,430 sq ft.
- A B&G Foods FSIS-inspected establishment is associated with CJ Logistics
  America in Fontana.

## Final confidence
**Medium.** Building positively identified and corroborated by web search. The
fenced east truck yard and single SE entrance are clear from 2026 satellite and
2023-2025 Street View. Confidence held to medium because a sliding gate at the
yard opening could not be positively confirmed (the truckGate / remoteGs calls
rest on the fenced enclosure), and the dock count and lane counts are estimates.
