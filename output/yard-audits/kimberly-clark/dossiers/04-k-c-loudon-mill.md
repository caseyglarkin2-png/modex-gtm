# Deep-Audit Dossier — K-C Loudon Mill (idx 04)

## Facility
- **Name:** K-C Loudon Mill — Loudon, TN
- **Type:** Tissue manufacturing mill (K-C Professional away-from-home tissue;
  Kleenex and Scott towel products)
- **Roster address:** 5600 Kimberly Way, Loudon, TN 37774
- **Resolved center:** 35.76764, -84.32992

## Step 0 — Location confirmation
Roster geocode (35.767638, -84.329922; moved 3.86 km) landed directly on a large
riverside industrial complex on Watts Bar Lake (Tennessee River). A z16 probe
showed a manufacturing mill with steam plumes (active operation), a separate
distribution warehouse, and wastewater treatment ponds — consistent with a
tissue mill. Web research confirms K-C's Loudon mill at 5600 Kimberly Way; the
EPA TRI facility ID `37774KMBRL5600K` corroborates the exact address. Center
kept at the mill building.

## Key views
- **Wide z16/z17:** Campus on Watts Bar Lake — main tissue mill (west), a
  separate large distribution warehouse with extensive drop yards (NE), and a
  wastewater treatment area (NW). Surrounded by woods and small-town Loudon.
- **Mill core (z18):** Large process building with visible steam — active
  paper-machine operation. Dock doors and trailers along the SW edge.
- **Warehouse + drop yard (z18):** Distribution warehouse with several long rows
  of angled-parked trailers — 100+ trailers in the drop yards.
- **Entrance (z18–z20 + Street View 2024):** Entry road off Kimberly Way passes
  a landscaped roundabout with a K-C monument sign. No barrier arm, sliding
  gate, or staffed guard booth was found at any entrance point.

## Gate / guard-shack / dock determinations
- **truckGate = false (flagged uncertain):** No barrier arm, sliding gate, or
  staffed checkpoint identified in satellite or 2024 Street View. The entry is an
  open industrial driveway past a monument-sign roundabout. Street View coverage
  of the internal road is limited, so a gate deeper inside the yard cannot be
  fully ruled out — flagged in uncertainFields.
- **guardShack = false:** No guard booth visible at any entrance.
- **remoteGs = false:** No controlled gate identified.
- **Docks:** ~30 doors estimated across the mill SW face and the warehouse face —
  banded **25-50**. Mill and warehouse have physically separate dock clusters →
  shipRcvSeparate = true.
- **railServed = false:** No rail spur runs into the property.

## Yard zones & counts
- **perimeter:** ~80 acres — the campus along Watts Bar Lake.
- **dropYards:** Large warehouse drop yard, several long rows of angled trailers,
  100+ trailers visible; capacity ~180.
- **dockAprons:** Mill SW apron and warehouse apron.
- **staging:** Paved yard before the warehouse docks → postGateStaging.
- **buildingCount ≈ 4** (mill, warehouse, treatment, ancillary); **scale** not
  visible — flagged uncertain.

## Web findings
- Made in Tennessee / Loudon County Chamber / Reliable Plant: K-C Loudon mill,
  Sanitary Tissue Paper, Kleenex and Scott towels for away-from-home markets;
  a $22M expansion added a new converting line and ~20 jobs.
- Yellow Pages / Manta / IndustryNet: Kimberly-Clark, 5600 Kimberly Way,
  Loudon TN 37774.

## Confidence
**Medium.** Facility unambiguously identified and the campus layout, drop yards,
and dock faces are clear. The gate / guard-shack determination is the soft point —
no controlled entrance was visible, but limited internal Street View coverage
leaves residual uncertainty; flagged in uncertainFields.
