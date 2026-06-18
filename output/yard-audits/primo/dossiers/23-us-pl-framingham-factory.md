# US PL Framingham Factory — Deep Audit Dossier

**Idx 23 · slug `us-pl-framingham-factory` · type: Bottling plant (PL)**
**Operator:** BlueTriton Brands (formerly Nestle Waters North America) — Poland Spring / Nestle Pure Life / ReadyRefresh
**Address:** 105 Pennsylvania Ave, Framingham, MA 01701
**Locked center:** 42.29965, -71.47905
**Maps (sat):** https://www.google.com/maps/@42.29965,-71.47905,400m/data=!3m1!1e3

---

## Operational status — OPERATIONAL (high confidence)

This blank-flag list entry resolved to a **live, active facility — not closed, demolished, or vacant.**

Evidence:
- **Satellite (2026 Maxar/Airbus):** building intact, white roof, water-storage silos/tanks on the south/SE, dozens of trailers and ReadyRefresh delivery box trucks in the yard, active dock face and fleet parking.
- **Street View (Aug 2023):** BlueTriton-branded blue delivery vans staged at the docks ("YOU / WE" wraps), chain-link perimeter fence with sliding gates, vertical water silo beside the building.
- **Web:** IndustryNet / Buzzfile / D&B list BlueTriton Brands active at 105 Pennsylvania Ave (~33 employees); an AWS (Alliance for Water Stewardship) certification report for the Framingham factory is on file (2020); the ReadyRefresh local-services page and Yelp reviews are updated through **May 2026**.
- The publicized BlueTriton bottling-plant **closure was in Ontario (Puslinch/Guelph) in 2025**, not Framingham.

Historically a 2-line bottling plant (3–5 gal returnable formats) drawing from MWRA/Quabbin–Wachusett supply; today it operates as a regional bottling + ReadyRefresh distribution / fleet hub. Either way the truck-yard footprint we audit is fully active.

---

## Location confirmation

No coordinates were supplied. Resolved by web search to 105 Pennsylvania Ave, Framingham MA 01701; Nominatim geocoded to ~42.300, -71.479. Satellite probing positively identified the **white-roofed plant/warehouse on the SOUTH side of Pennsylvania Ave** — the one with the on-site water silos, the ReadyRefresh truck fleet, and the fenced yard — as the BlueTriton building. The **dark-roofed building immediately east is a different occupant** and is excluded from the geofence. Center locked at 42.29965, -71.47905.

Setting: a dense suburban-Boston office/industrial park beside the I-90 / Mass Pike interchange, ~20 mi west of Boston. A large **solar field sits across Pennsylvania Ave to the north**; a **rail corridor runs along the south boundary** (no spur into the yard).

---

## What each view showed

- **z16/z17 wide:** the parcel inside the office park; building + west/north fleet yard + south silo/canopy area; separate dark building to the east.
- **z18 full:** clean perimeter trace — building center-left, fleet/trailer yard wrapping the north and west, canopy/racks + silos to the south, rail corridor at the south edge.
- **z19/z20 tight (N, NW, SW, SE):** angled trailer stalls along the north frontage; a long row of box trucks/trailers on the west edge; dock bank on the west face / NW corner with trailers backed in; round water silos at the SE of the building; covered rack/canopy structures on the south yard.
- **Street View (Aug 2023, multiple headings along Pennsylvania Ave):** brick building, dock doors, **chain-link perimeter fence with sliding vehicle gates**, BlueTriton/ReadyRefresh delivery vans, water silo. **No guard booth** at any gate.

---

## Gate / guard-shack / dock determinations

- **truckGate = TRUE.** Continuous chain-link perimeter fence with sliding chain-link gates across the entrances on the Pennsylvania Ave frontage. Entry is controlled at the fence, not an open run to the docks. Two gate openings serve the yard (`truckGateCount = 2`).
- **guardShack = FALSE.** No staffed booth (1–3 vehicle footprint, multi-side windows) anywhere along the frontage or at either gate, in Street View or satellite. Gates are unmanned.
- **remoteGs = TRUE.** Controlled gate + no guard shack → badge / keypad / remote check-in pattern. This is the YardFlow sweet spot (controlled access, no human at the gate).
- **dockDoors = 10-25.** Dock bank along the WEST face plus the NW corner; honest count ~12–16 truck-height doors (some sized for ReadyRefresh box trucks). Roof glare / mixed-vintage tiles limit an exact count.
- **dropArea = 25-50 / dropYard = TRUE.** Angled trailer stalls along the north frontage (~10–12) + a long box-truck/trailer row on the west edge (~12–15) + dock-adjacent vans = a real drop/fleet yard.
- **postGateStaging = TRUE.** Large paved internal yard between the gates and the dock face.
- **drivewayShort = TRUE.** Docks sit just inside the frontage fence; ~1–2 truck depth to the dock apron.
- **backupSensitive = FALSE.** Quiet industrial street + ample yard.
- **urbanRural = Urban.** Dense metro-Boston park beside the Mass Pike.
- **railServed = FALSE.** Rail corridor borders the south edge but no spur enters the property.
- **scale = FALSE / shipRcvSeparate = FALSE / multipleFacilities = FALSE.**

---

## Yard zones & counts

| Metric | Value | Note |
|---|---|---|
| Dock doors | ~14 | west face + NW corner; banded 10-25 |
| Trailers visible | ~30 | north angled stalls + west row + dock vans/trailers |
| Trailer parking capacity | ~60 | north + west + open yard at practical density |
| Truck gates | 2 | west fleet-yard gate + east-end gate, same yard |
| Buildings | 1 | plant/warehouse; silos + canopy = ancillary |
| Site area | ~9.5 ac | fenced BlueTriton parcel only |
| Rail served | No | south-edge corridor, no spur |

Geofences traced as oriented rings on the actual (slightly road-grid-rotated) footprint: perimeter (fenced parcel), truckGate (west frontage opening), two dropYards (north angled stalls; west fleet row), one dockApron (west dock face). Street View metadata flagged `hasCoverage: true` for perimeter and truckGate (frontage panos exist; headings aimed at the yard/gate).

---

## Web findings (summary)

- BlueTriton Brands, Inc. — 105 Pennsylvania Ave, Framingham MA 01701, bottled-water/delivery, ~33 employees (Buzzfile / IndustryNet / D&B).
- Nestle Waters NA Framingham factory: historically two bottling lines (3–5 gal), MWRA/Quabbin–Wachusett + tanker spring supply; AWS water-stewardship certification (2020).
- ReadyRefresh local page + Yelp (105 Pennsylvania Ave) updated through May 2026 → ongoing operation.
- Closure news pertains to BlueTriton's **Ontario** plant (2025), not Framingham.

---

## Confidence

**HIGH.** Facility positively identified, operational status confirmed by satellite + ground-level Street View branding + multiple business listings and recent reviews. Gate/guard/remote-check-in calls are well supported by Street View of the fence line. Soft fields (exact dock-door and trailer counts, lane counts) are honest overhead estimates and listed in `uncertainFields`.
