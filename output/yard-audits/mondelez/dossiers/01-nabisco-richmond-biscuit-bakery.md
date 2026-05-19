# Deep-Audit Dossier — Nabisco Richmond Biscuit Bakery (Richmond VA)

**Account:** Mondelez · **Roster idx:** 1
**Type:** Manufacturing — biscuit/cookie bakery
**Address:** 6002 S Laburnum Ave, Richmond, VA 23231
**Resolved center:** 37.49600, -77.35400
**Confidence:** High

## Location confirmation
Roster coordinates (37.495999, -77.352959) landed on/near S Laburnum Ave just
east of the building. Satellite probes (z16-z18) around that point revealed a
large industrial complex on the west side of S Laburnum Ave. Street View at
37.49334,-77.35344 (capture 2019-05) shows the entrance driveway with a
**"Mondelez International" monument sign** and the distinctive dark-clad bakery
building — positively confirming the facility. Web research corroborates: this
is Mondelez's Richmond biscuit bakery, ~1 million sq ft, ~650 employees, making
Oreo, Ritz, Nilla, Wheat Thins, Chips Ahoy. Locked center moved ~120m WNW of
the roster point to the true building-complex centroid.

## Key views
- **Wide (z16-17):** Industrial-park setting off S Laburnum Ave (a divided
  arterial with a signalized intersection). The bakery occupies the central
  property; modern speculative warehouses sit across the road to the east.
- **Main building (z18-19):** Loading docks with trailers backed in along the
  south face. Employee parking to the north/northwest.
- **West yard (z19, 37.4950,-77.3555):** Large dedicated trailer drop yard,
  many trailers parked in marked rows.
- **Entrance / gate (z20-21, 37.4947,-77.3551):** Chain-link fencing crosses the
  internal truck driveway; a gate controls access to the fenced trailer/dock
  yard; a small booth structure sits beside it.

## Gate / guard-shack determination
- **truckGate = true.** The road-side driveway off S Laburnum Ave is open, but
  there is a clear **internal controlled truck gate**: fencing crosses the
  driveway ~150m inside the property where it meets the fenced yard, with a
  gate across the truck lane (z21 imagery).
- **guardShack = true.** A small white-walled / brown-roofed structure with a
  ~1-2 vehicle footprint sits immediately beside the internal gate — consistent
  with a staffed guard booth controlling truck-yard entry.
- **remoteGs = false** (a manned booth is present).
- **drivewayLong = true.** The entrance driveway runs a long ~150m from the
  road intersection along the south building face before the gated yard —
  plenty of queue depth.
- **fastLaneOpportunity = true.** Wide paved apron and open yard at the gate
  give physical room for an express/bypass lane.

## Yard zones & counts
- **Perimeter:** Whole fenced property, S 37.49280 / W -77.35720 / N 37.49830 /
  E -77.35070 — approx 84 acres (treed buffer on the west reduces usable area).
- **Truck gate:** internal gate box around 37.4944-37.4949, -77.3554/-77.3547.
- **Drop yard:** west-side trailer lot, ~55 trailers visible, ~90 capacity.
- **Dock apron:** strip along the south main-building face.
- **Staging:** paved area on the entrance driveway between road and inner gate.
- **Dock doors:** ~40 across the south face → band 25-50.
- **Buildings:** 3 (main bakery, north wing, separate south building) →
  multipleFacilities = true.
- **Rail:** no spur into the property → railServed = false.

## Web findings
Richmond BizSense / WTVR / Axios Richmond: Mondelez's largest US biscuit
bakery, ~1M sq ft in Varina (Henrico County), ~650 employees, multi-decade
operation (50th anniversary noted), $122M expansion announced 2021. East Coast
hub for Oreo/Ritz/Nilla/Chips Ahoy/Wheat Thins.

## Final confidence: High
Facility unambiguously identified (monument sign + web corroboration). Gate,
guard booth, drop yard, and docks all visible in high-zoom imagery. Truck-scale
presence and exact outbound-lane count left low-confidence.
