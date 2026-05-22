# Kraft Heinz - Massillon, OH — Yard Audit Dossier

**Address:** 1301 Oberlin Ave SW, Massillon, OH 44647
**Type:** Manufacturer (frozen food production)
**Confirmed coords:** 40.7790, -81.5395
**Maps URL:** https://www.google.com/maps/@40.779,-81.5395,400m/data=!3m1!1e3
**Audit date:** 2026-05-22
**Method:** deep-audit (satellite + Street View + web research)
**Confidence:** medium

---

## 1. Location confirmation

The hint coordinates (40.7812, -81.5455) landed in a residential neighborhood
in northwest Massillon. Web research confirmed the actual address as **1301
Oberlin Ave SW** (chamber of commerce listing, FSIS USDA inspection database,
foodnavigator-usa, Indeed, Buzzfile). The real plant sits ~700m southeast of
the supplied point, on the south side of Oberlin Ave SW.

Identified the correct building via satellite probes at z15–z19: a large
multi-building food-manufacturing campus with heavy rooftop refrigeration
(consistent with a frozen-food plant). Street View on the south side
(40.7798, -81.5388, captured May 2024) shows the plant building wall with
industrial refrigeration on the roof and a chain-link perimeter fence —
confirming the right facility. Plant produces Weight Watchers Smart Ones and
similar frozen products; ~400–700 employees per public sources.

## 2. Site layout (locked from imagery)

- Locked center: **40.7790, -81.5395** — middle of the main processing
  complex.
- Perimeter bbox (approximate fence line):
  - North: 40.7805 (south side of Oberlin Ave SW, treeline buffer)
  - South: 40.7765 (south of water treatment tanks, treeline)
  - West: -81.5430 (west edge of large warehouse, woods buffer)
  - East: -81.5375 (east edge of main complex, before separate third-party
    warehouses east of property)
- Area: ~445m × ~463m → **~51 acres** for the main Kraft Heinz parcel
  (excluding adjacent buildings owned by other entities).
- Buildings: ~6 distinct connected/separate structures — main processing
  block (multi-wing), large west warehouse (purple-roofed), SE auxiliary
  building, ancillary buildings — multi-building campus typical of
  multi-decade manufacturing growth.

## 3. Gate / Guard-Shack determination

**Two access points off Oberlin Ave SW:**

1. **North-central open driveway** (~40.7805, -81.5395) — wide open driveway
   running south into the property. Street View (May 2024) shows an open
   approach with stop sign at the property entry but **no barrier arm, no
   gate, no guard shack** visible. Functions as the unrestricted main
   approach. This drives into a perpendicular internal road running E–W
   along the north face of the plant.
2. **South-side fenced gate** (~40.7800, -81.5388) — Street View shows a
   **chain-link sliding gate** with safety bollards / orange cones, fence
   line, and a tanker truck inside the gate (PEOPLES branded — Peoples
   Services 3PL). This is the commercial truck entry. No clearly resolved
   staffed guard booth at the lane — likely remote check-in / kiosk or
   process via main reception.

**Verdict:**
- `truckGate`: **true** — controlled south gate with chain-link sliding gate
  exists.
- `guardShack`: **false (uncertain)** — no staffed booth resolved on
  satellite or Street View. Marked uncertain in `uncertainFields`.
- `remoteGs`: **true (inferred)** — gate without visible shack implies
  remote/kiosk check-in. Plant of this scale would almost certainly route
  drivers through some control system.

## 4. Docks & trailer yard

**Dock doors (estimated ~28, band 25-50):**
- South face of main building: ~10–12 doors with ~5 trailers backed in
- SE / east extension building face: ~10–12 doors with several trailers
- West warehouse south face: ~6–8 doors
- Total visible: ~28 dock doors across multiple building faces

**Drop yard / trailer parking (band 10-25):**
- SW dock apron between the west warehouse and main complex has parked
  trailers without tractors (drop yard function)
- Smaller cluster of trailers east of the docks near the third-party
  warehouses
- ~16 trailers visible across all surfaces; capacity estimated ~25.

**`shipRcvSeparate`: true** — physically distinct dock banks on south face
(likely outbound frozen product) and west / SW face (likely inbound raw
materials / packaging). Common pattern for frozen food plants.

## 5. Driveways & staging

- Both entries have ~150–200m of internal road / paved yard before reaching
  dock faces → `drivewayLong: true` (queues 3+).
- Large paved central yard between buildings serves as post-gate staging /
  truck holding → `postGateStaging: true`.
- No clear pre-gate apron on Oberlin (tree buffer + grass shoulder).
- Wide paved gate aprons + unused width at both gates → `fastLaneOpportunity:
  true` (room to add bypass / express lane for appointment-aware drivers).

## 6. Other classification flags

- **urbanRural: Rural** — semi-rural / small-town industrial setting on the
  southern fringe of Massillon. Residential to north, fields/woods to south.
  Per rubric tiebreaker (small-town industrial → Rural).
- **connectivityIssue: false** — within Massillon metro footprint;
  cellular coverage adequate.
- **multipleFacilities: true** — multi-building manufacturing campus.
- **scale: false (uncertain)** — no truck scale resolved on satellite at
  z19. Could exist near the south gate but not visible. Marked uncertain.
- **dropYard: true** — dedicated trailer parking with parked trailers
  without tractors on SW dock apron.
- **multiStep: false** — single-stage entry; no second checkpoint resolved
  past the gate.
- **railServed: false** — no rail spur into the property. Major rail yard
  sits ~500m east beyond treeline but no spur connection.

## 7. Web findings

- 1301 Oberlin Ave SW; phone 330-837-8331.
- Frozen food center of excellence; produces Weight Watchers Smart Ones /
  Bagel Bites family.
- ~400-700 employees; multi-shift operation.
- $28M expansion announced 2013 (foodnavigator-usa, 2013-11-19); subsequent
  9-month interior demolition + remodel (Beaver Constructors profile)
  including a 9,000 sf spiral freezer and 6,500 sf water-storage addition.
- Listed as frozen food products supplier (industrynet, chamberofcommerce).

## 8. Sales relevance for YardFlow

Massillon is a high-volume frozen-food manufacturer with:
- Multi-building campus with **distinct ship vs receive dock clusters**
- **~28 dock doors** across multiple faces — non-trivial appointment volume
- **Drop-trailer operations** (Peoples Services 3PL visible in SV) — perfect
  fit for yard-management visibility on drop pool
- **Fenced south gate with no visible staffed shack** — strong candidate for
  remote check-in / mobile gate-in/out workflow
- **Fast-lane opportunity** at wide gate apron — bypass for appointment-aware
  drivers
- **No rail** = 100% truck-served, magnifying yard congestion exposure
- Semi-rural setting reduces backup-onto-public-road risk but the multi-
  building campus + drop trailers create classic "where's my trailer"
  problems

Archetype fit: **#6 Gate + GS + campus** style site but the guard-shack call
is uncertain — could fit **#5 Gate + RGS + campus** (Gate + Remote GS +
campus) better. Strong fit for an Auto Check-in + Yard Visibility + Spotter
Management story.

## 9. Final summary (3-line)

- Gate: **YES** — south-side chain-link sliding gate confirmed in Street View.
- Guard shack: **uncertain → false** — no staffed booth resolved; likely
  remote / kiosk check-in (remoteGs true).
- Confidence: **medium** — gate clear, dock counts solid, guard-shack and
  scale calls require ground-truth.
