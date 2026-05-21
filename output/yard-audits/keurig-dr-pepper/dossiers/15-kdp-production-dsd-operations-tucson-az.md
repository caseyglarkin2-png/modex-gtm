# Deep-Audit Dossier — idx 15

## KDP Production / DSD Operations — Tucson AZ

**Type:** Manufacturing & Distribution - Beverage/DSD
**Resolved location:** 931 S Highland Ave / 1201-1262 E 19th St, Tucson, AZ 85719 — `32.210800, -110.951400`
**Gate verdict:** Controlled fenced/gated perimeter (no booth) · **Guard shack:** None · **Confidence:** Medium

## Location resolution
Roster gave 3401 E Columbia St (32.1727, -110.9171). Step-0 probes showed that point lands in a
different industrial area ~3 km SE — not the facility. Web research resolved it: KDP acquired
**Kalil Bottling Co.'s Tucson real estate** (acquisition announced May 31, 2024; closed Q3 2024)
for **$8.55 million** — **seven buildings totaling 161,835 sq ft on 7.71 acres** at **931 S
Highland Ave and 1201-1262 E 19th Street, Tucson AZ 85719** (Real Estate Daily News; Waze lists
Kalil Bottling Co. at 931 S Highland Ave). KDP now operates this as a production facility plus
DSD distribution. Center locked at 32.2108, -110.9514.

## Key views
- **Wide (z17):** Older south-side Tucson industrial district, immediately adjacent to I-10.
- **Complex (z18/z19):** A multi-building campus — connected white/sawtooth-roofed buildings
  (production plant + warehouse), a central paved truck yard with trailers and tractors, a fleet
  vehicle lot SW with rows of DSD delivery box trucks/vans.
- **Street View (2025):** Chain-link perimeter fencing around the whole site; fenced yards
  stockpiled with beverage pallets and crates (blue plastic pallets, empties); yellow DSD
  delivery box trucks and a tractor-trailer working E 19th St.

## Gate / guard-shack / dock determinations
- **truckGate = true (flagged):** The entire complex is enclosed by chain-link perimeter fencing
  with gated openings off E 19th St / S Highland Ave — a controlled perimeter. A barrier-arm
  across a single truck lane could not be clearly resolved in imagery, so the call is flagged.
- **guardShack = false:** No guard booth structure observed at any gate opening.
- **remoteGs = true (flagged):** Controlled fenced/gated perimeter with no guard shack — implies
  badge / keypad / remote check-in. Flagged uncertain.
- **dockDoors = "10-25":** Dock doors on the production/warehouse faces; ~16 estimated. Older
  compact plant — count approximate.
- **dropArea = "10-25" / dropYard = true:** Trailers staged in the central yard plus pallet/crate
  storage; a dedicated staging area exists within the fenced complex.
- **multipleFacilities = true:** Seven buildings on one contiguous fenced parcel (production
  plant, warehouse, fleet/DSD operations) — a campus.
- **backupSensitive = true:** Compact older-urban site — short driveways, chain-link gate close
  to E 19th St, little internal stacking room.

## Yard zones and counts
- **Perimeter:** ~7.7 acres (matches the documented parcel) — the fenced multi-building campus
  bounded by E 19th St (N), S Highland Ave (E), and neighboring lots.
- **truckGate zone:** the gated opening off E 19th St into the central yard.
- **dropYards:** one — the SW trailer/pallet staging and DSD fleet area.
- **dockAprons:** one — the dock area along the production/warehouse buildings.
- **staging:** the central paved truck yard between buildings.
- **yardMetrics:** ~16 dock doors, ~14 trailers visible, ~25 trailer capacity, 2 gate openings,
  ~5 distinct buildings observed (record says 7 on the parcel), ~7.7 acres, not rail-served.

## Web findings
- KDP acquired Kalil Bottling's production, sales and distribution assets — gaining AZ bottling
  and distribution rights for Canada Dry, 7UP, A&W, Snapple, Core Hydration; ~425 employees added.
- Kalil's Tucson bottling plant had cold-pack capacity of 20M+ cases/year; family-run since 1948.
- The $8.55M real-estate transaction record gives the exact seven-building, 161,835 sq ft,
  7.71-acre parcel at 931 S Highland Ave / 1201-1262 E 19th St.

## Final confidence
**Medium.** The facility was positively re-located via the KDP-Kalil real-estate transaction
record (the roster address was wrong). The site is an older, compact, multi-building urban
complex that is harder to read from overhead — exact dock-door counts and gate detail (barrier
arm vs open fenced gate, lane counts) could not be fully resolved and are flagged.
