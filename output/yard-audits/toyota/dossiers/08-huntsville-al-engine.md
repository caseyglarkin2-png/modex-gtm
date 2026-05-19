# Deep-Audit Dossier — Toyota Motor Manufacturing Alabama (TMMAL), Huntsville AL

**Account:** Toyota · **Roster idx:** 8
**Facility type:** Engine Plant (V6 / V8 engines)
**Address:** 1 Cottonvalley Drive NW, Huntsville, AL 35810
**Resolved center:** 34.8295, -86.6375
**Confidence:** High

---

## Location resolution

Roster coordinates (34.829479, -86.638376, ROOFTOP, ~3.4 km move) landed
correctly on a large industrial plant building north of Huntsville. Satellite
probing at z15–z21 confirmed a single large engine-plant building with trailers
backed into the east face and large trailer drop yards to the north — fully
consistent with the TMMAL engine plant. This is **distinct from the Mazda-Toyota
JV assembly plant (idx 6)** — they are two separate Toyota facilities in the
Huntsville area.

## What the imagery showed

- **z15 / z16 overview:** A single large engine-plant building with employee
  parking to the south/west, trailer drop yards to the north, and a large solar
  farm on adjacent land to the east. Greenfield rural setting.
- **Dock apron:** Trailers backed into dock doors along the east face of the
  building; estimated ~35 dock doors (25-50 band).
- **Drop yards:** Two large dedicated trailer drop yards on the north side — a
  central yard with rows of ~60+ mixed-color trailers and an east yard with rows
  of ~50+ trailers. Combined, well over 100 parked trailers — a substantial drop
  operation. Separate from active dock staging.
- **Truck gate:** A controlled truck checkpoint sits on the truck lane at the SE
  side of the property (~34.8278, -86.6360) — a marked pinch-point lane with
  crosswalk-style stripes across the truck lane and a checkpoint structure
  beside it.

## Gate / guard-shack determination

- **truckGate: true** — Positively confirmed. The SE truck lane has a clear
  checkpoint pinch-point with crosswalk-style lane markings across the truck
  lane.
- **guardShack: true** — Positively confirmed. A small **blue-roofed,
  booth-sized structure (≈1-vehicle footprint)** sits directly beside the marked
  truck-gate lane, with guards' vehicles parked alongside. This is a classic
  staffed guard booth at the truck entrance.
- **remoteGs: false** — A guard shack is present, so remote check-in is false.
- **multiStep: false** — No second checkpoint observed.

## Yard zones and counts

- **Perimeter:** ~275 acres fenced plant footprint (excludes the adjacent solar
  farm).
- **Drop yards:** Two large north-side trailer yards (50+ band).
- **Dock apron:** One apron cluster on the east building face.
- **Buildings:** One main engine-plant building plus minor support structures —
  not a campus, so multipleFacilities false.
- **Rail:** No rail spur into the property — railServed false.

## Web findings

- Toyota's pressroom operations page lists TMMAL as the Alabama engine plant
  producing V6 and V8 engines, at 1 Cottonvalley Drive NW, Huntsville. It is one
  of Toyota's powertrain feeder plants — outbound product is engines trucked to
  Toyota assembly plants (e.g. TMMTX Tundra/Sequoia), inbound is castings and
  components. The plant predates and is operationally separate from the
  Mazda-Toyota JV assembly plant elsewhere in Huntsville.

## YardFlow relevance

TMMAL is a JIT engine feeder with an unusually large trailer-drop operation
(100+ trailers across two north yards) feeding ~35 dock doors through a single
guarded truck gate. A single gate funneling a large trailer population is
exactly the kind of pinch-point where gate check-in digitization and yard
trailer-location visibility cut driver wait time.

## Final confidence: High

Facility positively identified, truck gate and guard booth both directly
confirmed in tight satellite imagery, and yard zones well characterized. Dock
door count is the only approximate figure.
