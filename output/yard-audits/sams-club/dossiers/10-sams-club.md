# Yard Audit Dossier — Sam's Club Fulfillment Center, Lithia Springs GA (idx 10)

- **Facility:** Sam's Club Fulfillment Center
- **Type:** Fulfillment Center
- **Address:** 1000 Douglas Hills Rd, Lithia Springs, GA 30122 (RiverWest / Prologis industrial park, Douglas County)
- **Resolved center:** 33.7620, -84.6105 (building centroid)
- **Maps (satellite):** https://www.google.com/maps/@33.7620,-84.6105,400m/data=!3m1!1e3
- **Confidence:** high
- **Method:** deep-audit (satellite probe z15-z21 + Street View, 2025-03 panos)

## Step 0 — Facility confirmation
The supplied coordinates (33.760294, -84.610591) landed on the south parking/lawn
of the correct building. Confirmed via:
- **Web research:** Sam's Club fully leased Prologis' 1.1M-sqft spec warehouse in
  RiverWest, Lithia Springs ($142M, 600 jobs, occupied ~June 2024). The large
  single building at the center of the imagery matches a 1.1M-sqft footprint
  (~1000 ft x 1100 ft).
- **Ground truth:** The 2025-03 Street View monument sign at the entrance reads
  **"PROLOGIS / sams club / Associate-Visitor / Truck"** — positive ID.
The building runs roughly N-S, rotated ~5° clockwise (north end shifts east).

## Key views
- **Wide (z15-z16):** Single large rectangular DC in a dense cluster of other
  large DCs (RiverWest). Truck courts on both long faces; associate parking +
  retention pond at the south end; one entry drive from the south road.
- **Long faces (z18, east + west):** This is a **cross-dock** — continuous bank of
  dock doors with trailers backed in along BOTH the east and west walls, the
  full ~1000 ft length. North-end frame shows both faces lined with trailers.
- **Tight gate (z19-z20):** At the SW corner the private drive pinches to a
  controlled entry at the public road with lane/stop-bar markings; a small white
  ~1-vehicle booth sits beside the lane.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled SW entrance: pinch point + lane markings where
  the drive meets the public road, perimeter chain-link fence (visible behind the
  tree line in Street View), and the monument sign splitting Associate/Visitor vs
  Truck lanes. Not an open driveway.
- **guardShack = true.** Small white booth (≈1 parking-space footprint) set beside
  the entry lane at the SW gate (z20 satellite). remoteGs therefore false.
- **dockDoors = 50+.** Cross-dock with both ~1000 ft long faces fully docked;
  yardMetrics dockDoorCount ≈ 180 is an order-of-magnitude estimate.
- **shipRcvSeparate = true.** Two distinct dock banks on opposite building faces.

## Yard zones & counts (overhead estimates)
- **perimeter:** ~34 acres (shoelace over the traced ring), enclosing building +
  both truck courts + south parking/pond + entry drive. siteAreaAcres 34.0.
- **truckGate:** oriented quad over the SW entry pinch/booth.
- **dropYards (2):** east truck court and west truck court, both holding trailers.
- **dockAprons (2):** thin quads hugging the east and west dock walls.
- **staging:** post-gate paved court between the gate and the SE docks.
- **dockDoorCount ≈ 180; trailersVisible ≈ 70; trailerParkingCapacity ≈ 120;
  truckGateCount 1; buildingCount 1; railServed false** (no spur enters the lot).

## Street View metadata
- **truckGate:** pano `6MrZOhUEnkS93WqUkQUKbg` @ 33.75824,-84.60900 (2025-03),
  heading 306° — frames the Sam's Club monument sign / gate apron (the arrival shot).
- **perimeter:** pano `vJMckEfuINlzLq1mxhgN0A` @ 33.75979,-84.61036 (2025-03),
  heading 2° — frames the south office face across the associate lot.

## Web findings
- Prologis RiverWest spec building, ~1.1M sqft; leased in full by Sam's Club for
  national supply-chain expansion (CoStar/AJC/Area Development, Feb 2023).
- $142M investment, 600 jobs, Douglas County; targeted occupancy ~June 1, 2024.
- Listed as a 24/7 fulfillment center. A separate DC is under construction on the
  adjacent hill (visible with a crane in Street View) — not part of this property.

## Final confidence: high
Building positively identified by name (monument sign) and footprint; gate,
guard booth, cross-dock layout, and zones all read clearly in recent imagery.
Low-confidence items flagged: exact dock-door / trailer-capacity counts and the
entry/exit lane split.

### 3-line summary
- Gate: TRUE — controlled SW entry, fence + lane markings + Associate/Truck monument sign.
- Guard shack: TRUE — small white booth beside the entry lane (remoteGs false).
- Confidence: high.
