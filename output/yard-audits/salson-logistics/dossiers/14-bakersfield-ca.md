# SalSon Logistics — Bakersfield CA (idx 14)

**Facility type:** Intermodal / Fleet Location
**Roster address:** none supplied
**Roster coords:** none supplied
**Resolved location:** ~35.2392, -119.1093 — 12856 Old River Rd, Bakersfield, CA 93311 (PROBABLE)
**Confidence:** low

---

## Summary verdict

- **Gate:** NO controlled truck gate. Chain-link perimeter fencing along Old River
  Rd, but the vehicle entrance is an open, uncontrolled graded apron — no barrier
  arm, no sliding gate.
- **Guard shack:** NO. No staffed booth at the entrance.
- **Confidence:** low — location is a probable inference, not a SalSon-confirmed
  address, and the site is a small rural bulk-haul yard rather than the port
  intermodal terminal the roster type implies.

## Step 0 — location

No SalSon Bakersfield street address is published by SalSon or in any directory.
Bakersfield appears only as a named California *market* in merger / footprint
coverage ("Bakersfield, Inland Empire, Long Beach and Oakland, Calif." —
Transport Topics).

Resolution path — merged-company trace:

- **Sierra Trucking** is one of the seven companies merged into SalSon in
  Aug 2024 (Transport Topics, "Seven Logistics Companies Merge Into SalSon").
- **Sierra Transport LLC**, USDOT 2153955 (FMCSA SAFER status **ACTIVE**),
  registers its physical address as **12856 Old River Rd, Bakersfield CA 93311**.
  Independent directory listings (chamberofcommerce.com, bubba.ai, roserocket)
  corroborate that address; the company is described as drayage / intermodal /
  warehousing / brokerage with ~44 trucks.
- The address geocodes ROOFTOP to **35.238757, -119.109127** via the Google
  Geocoding API.

This is treated as the **probable** SalSon Bakersfield yard. It is an inference
from the merged-company list, not a SalSon-published fact — hence low confidence.
**Caveat:** Yelp lists "Lutrel Trucking" at the same 12856 Old River Rd parcel,
so directory data for this site is conflicting and the tenant identity is not
clean.

## What the imagery showed

- **Satellite (z17 / z18):** A small industrial compound on the east side of Old
  River Rd, surrounded on all other sides by orchards and open farmland southwest
  of Bakersfield. Roughly 6 metal buildings/sheds, a row of ~20–25 parked
  trailers and dump/tanker bodies along the north fence, large graded/dirt yard
  surfaces, and an adjacent orchard + residence with a pool at the southeast
  (excluded from the geofence).
- **Street View (entrance, captured 2025-05):** The truck entrance off Old River
  Rd is a **wide graded/unpaved apron** with an **OPAL-branded CNG/RNG fueling
  canopy** and small structures inside. The lane is **open** — no barrier arm, no
  guard booth. Chain-link perimeter fencing runs along the road frontage.
- **Street View (NE along the fence):** Confirms the yard — chain-link fence line,
  multiple metal buildings (one marked **"S T"**, consistent with *Sierra
  Transport*), and dump-body / tanker trailers parked against the fence. The
  trailer mix points to **bulk / aggregate hauling**, not container drayage.

## Determinations

| Field | Call | Evidence |
|---|---|---|
| truckGate | false | Open graded entry apron; no arm/gate. Fenced perimeter only. |
| guardShack | false | No booth at the entrance. |
| remoteGs | false | No gate at all → remote check-in does not apply. |
| postGateStaging | true (low conf) | Large open apron inside the entrance can hold queued trucks. |
| drivewayLong | true | Deep open yard from road to buildings; 3+ trucks can stack. |
| dockDoors | NONE | No dock-door building rhythm — a yard/maintenance/fuel operation, not a warehouse. |
| dropArea | "10-25" (low conf) | ~20–25 trailers/dump-bodies along the north fence; overhead count approximate. |
| dropYard | true | Dedicated trailer/equipment storage strip along the north edge. |
| fastLaneOpportunity | true (low conf) | Large unused unpaved width at the entry apron. |
| scale | false (uncertain) | No truck scale clearly identifiable. |
| urbanRural | Rural | Orchards and open farmland on all sides. |
| multipleFacilities | false | One compound. |

## Yard zones & metrics

- **Perimeter:** drawn around the operational truck-yard compound (buildings +
  trailer row), excluding the southeast orchard/residence. ≈14 acres.
- **truckGate zone:** the open entry apron where the driveway meets Old River Rd.
- **dropYard zone:** the trailer/equipment storage strip along the north fence.
- **dockAprons / staging:** none — no docks; staging is the general yard apron.
- **yardMetrics:** dockDoors 0; trailersVisible ≈22; capacity ≈60; truckGates 1;
  buildings ≈6; ≈14 acres; rail-served false (no spur).

## Web findings

Sierra Transport / Sierra Trucking: ~44 trucks, ~21 years operating, drayage /
intermodal / warehousing / brokerage / freight forwarding, ~$6M revenue, FMCSA
ACTIVE. One of the seven companies rolled into SalSon in Aug 2024.

## Confidence

**Low.** The location is a reasonable inference (an active, named merged-company
yard at a verified address) and the imagery clearly shows a real trucking yard,
so the *physical* classifications are credible. But SalSon never publishes a
Bakersfield address, the parcel has a conflicting "Lutrel Trucking" directory
listing, and the site is a small rural bulk-haul yard rather than the port
intermodal terminal the roster type label suggests — any of which could mean
this is not the facility SalSon counts as its "Bakersfield" operation. Flagged
for human confirmation.
