# Pactiv Evergreen - Plattsburgh NY (idx 30)

## Resolved location — ROSTER COORDS WERE WRONG
- **Address:** 74 Weed Street, Plattsburgh, NY 12901
- **Roster coordinate (incorrect):** 44.708769, -73.453892 (geocode
  RANGE_INTERPOLATED) — this landed on a small orange-roofed building in a
  residential block, not an industrial facility.
- **Corrected locked center:** ~44.71100, -73.45250
- **How confirmed:** Web research (Yelp, CMac, Breakroom plant-manager and packer
  job postings) all list the facility at 74 Weed Street. Satellite survey around
  the roster point found exactly one industrial campus matching: a large
  multi-building complex ~0.3 km NE of the roster point. The campus is the legacy
  Plattsburgh molded-fiber plant — built ~1902, ~150 employees, producing
  sustainable molded fiber products (cup carriers, school lunch trays, plates,
  bowls). Pactiv Evergreen is now part of Novolex.

## Site layout
- A sprawling multi-building campus, ~39 acres:
  - **Legacy mill (center/south):** many interconnected dark-roofed buildings —
    the original ~1902 paper/fiber mill structures.
  - **Modern warehouses (north):** several large light-roofed warehouse buildings.
  - **Legacy brick office (SE):** 2-story brick office building fronting Weed
    Street with a flagpole and monument sign.
- Truck/dock operations are on the north and NW sides of the campus.
- **Dock face:** a dock canopy bank on the west face of a north warehouse with
  ~12 trailers backed in; additional dock doors on the NE warehouse face.
- **Drop yards:** a large gravel/paved drop yard on the NW side holding multiple
  rows of parked trailers (~20+), plus trailers along the NE warehouse face.

## Gate / guard-shack determination
- **truckGate: true.** The entire campus is enclosed by continuous chain-link
  perimeter fencing — confirmed in every 2023/2025 Street View pass along Weed
  Street (north, NE, main-entrance, and SW headings all show the fence line).
  Truck and dock yards are reached through gated openings in that fence. Flagged
  uncertain in the JSON: the fence line is unambiguous, but no single
  barrier-arm checkpoint was crisply imaged, so the exact gate mechanism is an
  inference.
- **guardShack: false.** No staffed guard booth visible at any perimeter gate
  opening. The legacy brick building on Weed Street is an office, not a gate
  booth.
- **remoteGs: true.** Fence-and-gate controlled campus with no manned booth —
  implies badge / kiosk / call-box check-in.

## Yard zones and counts
- **Perimeter:** ~39 acres covering the full legacy mill + warehouse campus.
- **dockDoorCount:** ~22 (band 10-25) — estimate; dense legacy layout obscures
  some building faces.
- **trailersVisible:** ~30 across the NW drop yard and NE warehouse face.
- **trailerParkingCapacity:** ~50 — large NW drop yard plus NE apron.
- **truckGateCount:** ~2 perimeter gate openings.
- **buildingCount:** ~8 distinct building masses (legacy mill is many
  interconnected structures — approximate).
- **railServed:** true (medium confidence) — rail lines run along the west edge;
  a spur appears to enter the property; the 1902-era fiber mill was historically
  rail-served.

## Web findings
Yelp / CMac / Breakroom: Pactiv Corporation / Pactiv Evergreen, 74 Weed Street,
Plattsburgh NY 12901, phone 518-561-4880. Plant built ~1902, ~150 employees,
manufactures sustainable molded fiber products (cup carriers, school lunch trays,
plates, bowls). Multiple safety and environmental awards over its history.
Pactiv Evergreen is now part of Novolex.

## Final confidence: MEDIUM
The roster coordinate was wrong and was corrected; the facility is positively
identified by address-corroborated web research and satellite survey. Gate calls
rest on clear perimeter-fence imagery but the exact gate mechanism, dock count,
building count, lane counts, rail-spur entry, and site area are flagged uncertain
because the dense legacy campus layout limits overhead resolution. truckGate /
guardShack determinations are nonetheless solid: fenced campus, no guard booth.
