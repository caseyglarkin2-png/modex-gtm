# Deep-Audit Dossier — idx 17

## Facility
**Glovis EV Logistics America - Savannah Integrated Warehouse (Pooler GA)**
Type: Distribution Warehouse / Logistics Hub
Roster address: Pooler, GA 31322 (street address not publicly disclosed)

## Status: UNRESOLVED — facility could not be located

This facility could not be positively located, despite a genuine search effort.
Per the deep-audit instructions, the `.json` is written with `confidence: low`,
all 22 classification fields listed in `uncertainFields`, and explanation here.

## What was attempted
- **Step 0 satellite probes:** The roster coordinate (32.088338, -81.262896)
  was probed at z14-z16. It lands inside a residential subdivision in eastern
  Pooler — not a warehouse. The roster geocode precision is APPROXIMATE; this is
  a Pooler ZIP-31322 centroid, not a building.
- **I-16 corridor sweep:** Probed the Pooler / I-16 industrial corridor west of
  the point (around 32.098,-81.318 and 32.103,-81.305). The corridor contains
  multiple large speculative logistics warehouses and significant land under
  construction. No single building could be attributed to Glovis.
- **Web research:** The Glovis "Savannah integrated warehouse" opened only in
  Q1 2026. The two primary sources — Seoul Economic Daily (2026-04-15) and
  Korea Herald — both describe it only as being in "Savannah, Georgia," ~69,000
  square meters (~742,000 sqft, "about 10 soccer fields"), built to absorb
  HMGMA outbound cargo plus regional customers. Neither names a street address,
  industrial park, highway, or coordinates.
- **Corporate records:** FMCSA registers GLOVIS EV LOGISTICS AMERICA LLC at
  600 Kona Drive, Ellabell GA 31308 — that is the HMGMA Metaplant campus
  support address, not the new Pooler integrated warehouse.

## Why it remains unresolved
The facility is brand-new (opened Q1 2026) and no public source ties it to a
specific Pooler building or parcel. The roster explicitly recorded "exact street
address not publicly disclosed - city/ZIP only." Recent satellite imagery of the
Pooler corridor shows many candidate warehouses but no confirmable Glovis
identification — committing to one would be a guess, not an audit.

## Output notes
- `perimeter` is a PLACEHOLDER nominal box around the unverified ZIP-centroid
  coordinate — it is NOT a confirmed building footprint and must not be treated
  as a usable geofence.
- All classification fields are defaults and flagged uncertain. A Glovis
  HMGMA-linked integrated distribution warehouse would most plausibly be a
  dock-door cross-dock building with a guarded or gated truck entrance, but
  none of this could be verified from imagery.

## Web findings
GLOVIS EV Logistics America LLC (est. 2022-10-06) provides Tier-1 logistics,
warehousing and inventory services to Hyundai Motor Group Metaplant America.
The Savannah integrated warehouse is a production-linked logistics hub for
HMGMA outbound volume; size ~69,000 sqm; opened Q1 2026.

## Confidence
**Low.** Facility location unverified — flagged for human review / address
disclosure.
