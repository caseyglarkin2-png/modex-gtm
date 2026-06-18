# Deep-Audit Dossier — Site 05: US PL Cabazon Factory

- **Facility:** US PL Cabazon Factory (Arrowhead / Nestlé / BlueTriton / Primo Brands bottling plant)
- **Type:** Bottling plant (PL)
- **Resolved center:** `33.91330, -116.75170`
- **Mailing address of record:** 14020 Elm St, Cabazon, CA 92230 (corporate/mailing address — see below)
- **Method:** deep-audit
- **Final confidence:** medium

---

## 1. Locating the facility — and a corrected pin

The brief gave the address **14020 Elm St, Cabazon CA** and coords **33.9164, -116.7873**. Those are correct *as the corporate/mailing address* — every business directory (D&B, BuzzFile, Yelp, Manta, IndustryNet) lists "BlueTriton Brands / Nestlé Waters / Arrowhead" at 14020 Elm St. But that address sits on a small fenced warehouse cluster on the south frontage road of I-10, and Street View there (Dec 2025) showed the principal gated building is the **COUNTY OF RIVERSIDE — CABAZON — FLEET SERVICES**, not Arrowhead (monument sign read clearly from the road).

Web research resolved the real operating plant: the Nestlé/BlueTriton/Primo **Arrowhead Cabazon bottling plant is a 390,000 sq ft LEED-Silver facility on the Morongo Band of Mission Indians reservation along I-10**, producing roughly 1 billion bottles/yr of Arrowhead and Nestlé Pure Life. Its signature feature is **three on-site GE wind turbines** (Nestlé's first on-site wind turbines anywhere), supplying ~50% of plant electricity.

I located that plant by scanning east along I-10 at z15-z16 and spotting a massive white-roofed building with **two visible wind turbines plus their long blade shadows, a substation, and water-storage tanks** at its SW corner — a positive, unambiguous ID. Locked center: **33.9133, -116.7517**, about 1.6 km ESE of the mailing address. The audit below is of this real operating plant.

## 2. What each key view showed

- **z16-z17 overview:** One very large bottling-plant/warehouse building, long axis running NW→SE, set in open desert. Employee parking + main entrance at the NW end; wind turbine / substation / water-tank utility cluster + a long admin-maintenance building at the SW corner; a huge paved truck yard wrapping the NE and SE faces.
- **z18-z19 NE/E face:** A **continuous dock-door bank running the entire NE wall** with trailers backed in along its full length, and a deep paved drop yard packed with parked 53' trailers in marked rows.
- **z19-z20 mid-dock + yard:** ~40+ trailers in a single tile — long organized rows of drop trailers plus dock-backed units. Wide internal drive aisles and a large open staging apron between dock and drop rows.
- **z19-z20 SW corner:** Wind turbine pad (circular base + long blade shadow), electrical substation, water-storage tanks, and a long single-story admin/maintenance building. This is the utility/admin zone, not a truck checkpoint.
- **z18 NW corner:** Employee/visitor parking, the projecting main building entrance, and the access road arriving from the SW at a stop-controlled junction.

## 3. Gate / guard-shack / dock determinations

- **Truck gate — FALSE (medium confidence).** No barrier arm, sliding gate, or staffed booth is visible across the truck approach. The plant sits in open desert on tribal land; a single paved access road climbs ~600 m from the SW and opens directly onto the paved yard. **Street View** from the access road (pano `XV-fnhv-vjC6iaPUPaq7sw`, Dec 2025, looking E/NE at the plant) shows a wide open paved entrance — no gate, no arm, no guard structure. The nearest pano stops ~150-200 m short of the building, so a gate at the very yard edge cannot be 100% excluded; overhead z19-z20 of the entrance pinch show no booth or arm. Net: open approach.
- **Guard shack — FALSE.** No 1-3-vehicle-footprint booth with multi-side windows at the entrance or along the approach. The only small structures are the SW admin building (too large, set back) and utility sheds by the substation.
- **Remote GS — FALSE.** Requires a gate present-but-unstaffed; no gate is confirmed.
- **Dock doors — "50+".** Continuous dock bank along the whole NE building face; honest count ~55-60 bays. Banded 50+.
- **Drop area — "50+" / dropYard TRUE.** Dedicated multi-row trailer-storage lot fills the eastern half of the paved yard, distinct from the active dock apron; 50+ trailers.

## 4. Yard zones and counts measured

| Metric | Value | Basis |
|---|---|---|
| dockDoorCount | 58 | continuous NE-face bank, z18/z19 |
| trailersVisible | 95 | ~30-40 at dock + 50-60 in drop rows |
| trailerParkingCapacity | 130 | marked rows + aisles/apron |
| truckGateCount | 1 | single SW access road |
| buildingCount | 2 | main plant + SW admin/maintenance bldg |
| siteAreaAcres | ~38 | perimeter polygon (building + paved yard) |
| railServed | false | no spur into property |

**Geofences (oriented to the NW-SE building angle):** `perimeter` traces the building + full paved yard + SW utility area; `dropYards[0]` the eastern multi-row trailer lot; `dockAprons[0]` the long thin strip hugging the NE dock wall; `staging` the internal queue apron between dock and drop rows; `truckGate` the open paved mouth at the SW road entry. `streetViewMeta` uses the SW access-road pano (`XV-fnhv-vjC6iaPUPaq7sw`, heading ~50° toward the plant) for both perimeter and truckGate — the only Street View coverage near the site; no in-yard panos exist.

## 5. Web findings

- Plant: 390,000 sq ft, LEED-Silver (2004), on the Morongo Band of Mission Indians reservation, ~1 billion bottles/yr (Arrowhead + Nestlé Pure Life). [Nestlé USA, PRNewswire, Foundation Windpower]
- Three on-site GE wind turbines (first two ~2012, third GE XLE 1.85 MW added 2018); combined ~22 M kWh/yr, ~50% of plant electricity. [PRNewswire, Environmental Leader]
- Ownership chain: Nestlé Waters → BlueTriton Brands (2021 buyout) → Primo Brands (2024 BlueTriton + Primo Water merger). Cabazon branch ~109 employees. [Wikipedia, D&B, SBCSentinel]
- 14020 Elm St is the registered branch/mailing address; the operating plant is the reservation facility ~1.6 km ESE. The Elm St cluster also hosts a separate Riverside County Fleet Services yard (ruled out by its monument sign).

## 6. Final confidence — medium

The facility is positively identified (wind turbines + scale are decisive) and dock/yard/drop classifications are strong (50+ docks, 50+ drop trailers, deep driveway, large staging). Confidence is held at **medium** because: (1) Street View stops short of the property edge, so the gate/guard-shack negatives rely on overhead imagery plus the approach pano rather than an at-gate frame; (2) the overexposed white roof bleeds into the dock edge, making the exact door count approximate; (3) scale, ship/receive separation, and connectivity are inferred. Uncertain fields are flagged in the JSON.
