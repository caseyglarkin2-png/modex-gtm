# Deep-Audit Dossier — Tractor Supply DC Nampa, ID (idx 11)

**Facility:** Tractor Supply Distribution Center, Nampa ID
**Type:** Distribution Center (under construction)
**Address:** 9640 Ustick Rd, Nampa, ID 83687
**Resolved center:** 43.63125, -116.58875
**Maps:** https://www.google.com/maps/@43.63125,-116.58875,400m/data=!3m1!1e3
**Confidence:** LOW (construction-era imagery — building not yet usable)
**Method:** deep-audit (satellite probe.ts + Street View Aug-2025 + web research)

---

## Step 0 — Location confirmation

Supplied coords (43.634786, -116.586452) land on a road intersection at the NE
edge of a greenfield parcel south of Ustick Rd. Web research confirmed this is
Tractor Supply's 11th distribution center ("Project Spud" on the architectural
drawings): groundbreaking 2025-04-22, 865,000 sq ft, ~$225M investment, 500+
jobs, LEED, serving 200+ PNW stores, target ops late 2026 / early 2027, at the
**NE corner of Ustick Rd and Midland Blvd** — exactly this parcel.

Important disambiguation: a separate, fully-built long white-roofed warehouse
sits ~700m to the SE (employee parking with solar carports on its west face,
consistent with an Amazon facility). That is NOT this site and was excluded.
The TSC parcel is the graded greenfield directly at the Ustick/collector corner.

Locked center on the active graded development parcel: **43.63125, -116.58875**.

## What the key views showed

- **Wide satellite (z15/z16):** Two distinct properties in the corridor. The TSC
  parcel (NW, at the Ustick intersection) is a graded oval pad with construction
  trailers, concrete forms, pipe/material stockpiles, a green temporary
  water-treatment pond, and a perimeter haul road — early earthwork only. The
  finished white building to the SE is a different (Amazon-type) facility.
- **Tight satellite (z17/z18) of the TSC pad:** No building shell on the
  overhead 2026 capture — only laydown yard, trailers, forms, stockpiles. No
  dock doors, no dock apron, no striped trailer parking, no fence line, no gate
  or guard booth.
- **Street View, Aug-2025 (panos on the bordering public roads):** Looking SW
  from Ustick, a long line of **tilt-up concrete wall panels** is being erected
  along the SW edge of the pad — the building shell at its very start — fronted
  by bare graded earth. No operational features yet.

## Gate / guard-shack / dock determinations

- **truckGate: false** — No gate, arm, or checkpoint exists. The `truckGate`
  geofence ring marks the PLANNED/most-likely truck entrance off the new N-S
  collector road on the west edge; nothing is built or controlled there yet.
- **guardShack: false** — No booth or any built entrance structure present in
  any image.
- **remoteGs: false** — No gate, so no remote check-in either.
- **dockDoors: NONE** — Shell not erected; no doors countable. The completed
  865k sq ft DC will ultimately carry a large dock bank (50+), but that is a
  future state, not visible.
- **dropArea / dropYard: NONE / false** — Graded dirt only; no trailers, no
  striped stalls. A large drop yard is expected once operational given the
  facility's scale and PNW-hub role, but absent today.

## Yard zones and counts measured

- **perimeter:** 4-corner ring over the visibly graded development parcel,
  square to the orthogonal Ustick(N) / collector-road(W) grid (the site is
  effectively north-aligned). ~55 acres. Exact fenced boundary not yet set.
- **truckGate:** small planned-entrance ring on the west collector road.
- **dropYards / dockAprons / staging:** none — left empty / null (do not exist).
- **streetViewMeta:** real Aug-2025 panos —
  perimeter `_OAi25c09UnWzkgzx1OnmA` (east-edge road, heading 263°),
  truckGate `CZaUHNAjeiKc0KMZlLjSdg` (Ustick near NW roundabout, heading 198°).

### yardMetrics
- dockDoorCount: 0 (none built)
- trailersVisible: 0
- trailerParkingCapacity: 0
- truckGateCount: 1 (planned)
- buildingCount: 0 (only construction trailers + partial wall panels)
- siteAreaAcres: 54.9 (graded development parcel; full assembled site larger)
- railServed: false (no rail spur visible or reported)

## Web findings

- Tractor Supply Co. broke ground 2025-04-22 on its 11th DC at 9640 Ustick Rd,
  Nampa (Canyon County) — its first Pacific Northwest DC.
- 865,000 sq ft, ~$225M initial investment, 500+ full-time jobs, LEED-certified,
  serves 200+ stores across the PNW. Hiring begins Q2 2026; completion late 2026
  / early 2027. Internal/architectural codename "Project Spud."
- Located at the NE corner of Ustick Rd and Midland Blvd, with room for a future
  ~150,000 sq ft expansion.

Sources: Tractor Supply IR newsroom; BusinessWire/Nasdaq/Morningstar release
(2025-04-23); BoiseDev "Project Spud" (2024-11-08); Idaho Press; HBS Dealer;
Farm Progress; Store Brands.

## Final confidence

**LOW.** The facility is positively identified and located, and the parcel and
planned building orientation are clear, but the imagery is construction-era: no
building shell, gate, guard shack, docks, or trailer yard exist yet. All
operational classification fields are listed in `uncertainFields` and should be
re-audited once the DC is built and captured in post-2026 imagery.
