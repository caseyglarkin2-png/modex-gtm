# Deep-Audit Dossier — idx 24 · Michigan Dairy (Kroger Dairy Plant)

**Address:** 29601 Industrial Road, Livonia, MI 48150
**Resolved center:** 42.379921, -83.338345
**Confidence:** high

## Location confirmation (Step 0)
Google geocoder resolves "29601 Industrial Rd, Livonia, MI 48150" exactly to the
supplied coords (42.37992, -83.33834) — the central building in the satellite
frame. Web search confirms this is **Kroger Michigan Dairy**, a fluid-milk
manufacturing plant (Livonia/Westland chamber listing; Quickway-branded
trailers and stainless milk tankers on site corroborate a Kroger dairy). Visual
confirmation: a cluster of large round bulk-milk **silos** on the NE roof/yard
(z19/z20 sat), definitive for a dairy plant. This is the right building, not an
office or neighbor (the large white building directly south across Industrial Rd
is a separate QuikTrip facility).

## What the key views showed
- **z18/z19 satellite:** single large monolithic plant building, dark roof,
  rooftop HVAC + bulk silo farm at NE. Long dock bank on the south face with
  trailers backed in. Extensive trailer drop-yard rows to the west; tanker/
  trailer staging on the south/SE. Building sits roughly E-W with a slight (~6-8°)
  clockwise rotation off north.
- **SV south frontage (facing N, 2 panos):** long south dock face, 50+ doors,
  trailers + stainless milk tankers backed in, a yard hostler working the apron,
  and **continuous chain-link perimeter fence** across the whole frontage.
- **SV SE drive (facing NW/NE):** Quickway trailers + milk tankers staged inside
  the fence; employee parking lot to the NE; fence continuous, gated opening at
  the access drive.
- **SV NW service road (2024, facing W):** brick north building face, silo at
  left, chain-link fence both sides of the north service road. Property fenced
  on all four sides.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The entire property is fenced (confirmed in 6 SV frames
  spanning 2019/2022/2024). Trucks enter through a gated opening on the SE/east
  access drive — a controlled, fenced entrance, not an open curb cut.
- **guardShack = false / remoteGs = true.** No staffed guard booth is visible at
  any entrance in any SV vintage. As a Kroger-owned plant run with a dedicated
  carrier (Quickway), entry is most plausibly kiosk/call-box or known-carrier
  check-in. Medium confidence — flagged in uncertainFields.
- **dockDoors = "50+".** Long south-facing dock bank, ~55 doors estimated, many
  occupied by trailers and tankers.
- **dropArea = "50+" / dropYard = true.** Large Quickway drop-yard rows west of
  the building plus south/SE staging; well over 50 trailer stalls.

## Yard zones & counts (overhead estimates)
- **perimeter:** traced fenced property, ~296 m (W-E) x ~195 m (N-S), ~14.6 acres.
- **dropYards:** (1) the large west drop yard; (2) south/SE tanker-trailer staging.
- **dockApron:** long thin quad hugging the south dock wall.
- **truckGate:** the SE access-drive entrance zone.
- dockDoorCount ~55; trailersVisible ~90; trailerParkingCapacity ~140;
  truckGateCount 1; buildingCount 1; railServed false.
- **streetViewMeta:** perimeter pano `mY1GRH9YUVImuc9WJnSVOg` (S frontage,
  heading 335° toward dock face); truckGate pano `pdd2KQVbF6MVjn7KfqyOoQ`
  (SE drive, heading 351° toward the gate).

## Web findings
Kroger Michigan Dairy — fluid-milk manufacturing, 29601 Industrial Rd, Livonia
MI 48150, 24-hour operation, listed under Kroger's Michigan footprint. Quickway
Carriers (Kroger's dedicated dairy hauler) trailers + stainless milk tankers
on site. No public driver reviews surfaced on gate/check-in procedure.

## Final confidence: HIGH
Building identity, fenced perimeter, dock scale, and drop-yard scale are all
clear and corroborated. Guard-shack/remoteGs and exact lane counts are the only
medium-confidence calls (no booth visible; gate present), flagged accordingly.
