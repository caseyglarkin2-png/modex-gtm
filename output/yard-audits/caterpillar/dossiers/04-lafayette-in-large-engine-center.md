# Deep-Audit Dossier — Caterpillar Lafayette IN Large Engine Center (idx 4)

## Resolved location
- Roster geocode `40.416451, -86.844274` (ROOFTOP) lands on the **Caterpillar Large Engine Center** campus in south Lafayette.
- Locked the 1.6M sq ft main building center at **`40.4138, -86.8460`**.
- Confirmation: Street View from South St shows the long **CATERPILLAR-branded engine plant building**; web (Chamber of Commerce, Waze "Building LFT-L", Caterpillar press release) confirms the 1.6M sq ft Large Engine Center, ~1,900 employees, producing Cat 3500/3600/C175 engines, with a $725M expansion underway.

## Key views
- **Wide (z15-16):** The LEC is the large light-roofed complex in Lafayette's developed south-side; commercial retail and residential subdivisions nearby (Urban setting).
- **Core (z17):** Long main engine plant building; employee parking lots to the north along South St.
- **South Street View (2025-08):** Caterpillar-branded building frontage with open lawn and a parking lot — no perimeter fence on the office frontage.
- **South / SE (z18-20):** A large paved truck yard with canopied dock aprons, trailers backed in, and extensive material laydown (crates/components); a Cat vehicle visible. A rail line runs diagonally along the SE edge.
- **SE building:** A separate building (customer/training center) on the same campus.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Truck and dock operations are on the south/SE face — a large paved truck yard with canopied dock aprons reached by a long internal road. The North (South St) frontage is open office/employee access; the truck area is set deep on internal roads, implying a controlled service gate inside the campus.
- **guardShack = false / remoteGs = true.** No road-visible guard booth — the office frontage is open and the truck gate is internal. Classified as a controlled service gate without a road-edge booth; medium-low confidence.
- **Driveway:** `drivewayLong = true` — the truck approach runs a long internal road from South St to the south dock yard.
- **fastLaneOpportunity = true** — the south truck yard is a very wide paved apron with abundant unused width.
- **Docks:** ~22 dock doors estimated (band 10-25) under canopied aprons on the south face; canopies obscure the exact count — low confidence.

## Yard zones and counts
- **Perimeter:** ~230 acres campus including parking, truck yard and laydown.
- **Drop yard:** Trailers across the wide south truck yard plus drop space by the dock canopies; `dropYard = true`, `dropArea = 25-50`.
- **Rail:** A rail line runs along the SE edge; a spur appears to reach the south dock/laydown area — rail-served, medium confidence.
- **Metrics:** dockDoors ~22, trailersVisible ~24, trailer capacity ~45, truck gates 1, buildings 4, rail-served true.

## Web findings
- Chamber of Commerce / Waze: Caterpillar Large Engine Center / Building LFT-L, 3701 South St, Lafayette IN 47905.
- Caterpillar press release + basedinlafayette.com: 1.6M sq ft, ~1,900 employees, 3500/3600/C175 engines, $725M expansion (one of Lafayette's biggest).

## Final confidence
**Medium.** Location positively confirmed (Caterpillar-branded building, ROOFTOP geocode). Truck yard, dock aprons, drop space and the SE rail line are clear. The guard-shack / remote-gate call, exact dock count, and rail-spur connection are uncertain — canopies obscure the docks and the gate is internal. Imagery may predate the completed $725M expansion.
