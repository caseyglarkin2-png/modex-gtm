# Deep-Audit Dossier — US PL Poland Spring Factory

**Type:** Bottling plant (PL)
**Resolved location:** ~1231 Maine Street (ME Route 26), South Poland, ME 04274
**Locked center:** 44.03205, -70.35350
**Maps (satellite):** https://www.google.com/maps/@44.03205,-70.35350,400m/data=!3m1!1e3
**Confidence:** High

---

## 1. How the site was resolved

The supplied approximate coordinates (44.0558, -70.3475) landed in forest / golf-course
terrain roughly 2.8 km NNE of the real plant. The spreadsheet street address
"375 Paramount Dr, Raynham MA" is the **Primo Brands corporate HQ**, not a plant — it
was disregarded per the task warning.

Web research (Wikipedia "Poland Spring Bottling Plant and Spring House," the Poland town
office business directory, the Center for Land Use Interpretation land-use database, and
Maine news coverage) plus satellite confirmation pinned the **active Poland Spring /
Primo Brands bottling plant** (formerly BlueTriton / Nestle Poland Spring). It is a large
single industrial building running NW-SE, reached by a long private drive off Maine
Street (ME Route 26, locally "Spring Water Road") in South Poland, immediately east of
the Poland Spring Resort golf course. Corporate address of record: 1231 Maine Street,
Poland ME 04274.

This is the **Poland / Poland Spring** plant — distinct from the separate Hollis ME
plant (being audited separately) and from the historic 1907 spring house / museum on
Preservation Way to the west.

## 2. What the key views showed

- **Wide (z15-16, p10-museum-z15 / p10-final-z16):** The plant complex is a long
  bright industrial building oriented NW-SE, flanked by woods and several ponds, with the
  resort golf course to the west. A long private access drive winds south/SW from the
  yard to the public road through forest.
- **Plant body (z16-17, p10-plant-z16 / p10-plant-z17):** Single large connected
  building; a wider process/warehouse block at the NW end joins the long warehouse that
  carries the dock bank. The SW/south face is the truck-dock face with trailers backed in
  along its length.
- **Dock face (z18-19, p10-dock2-z19 / p10-dockmid-z18):** A continuous loading-dock
  bank runs nearly the full length of the building with trailers backed into bay after
  bay. Door count reads well into the 50+ band.
- **South yard (z18, p10-south-z18 / p10-entrance-z18):** A large drop yard with
  multiple long diagonal rows of parked trailers, plus a circular water tank / clarifier
  with a small green-roofed structure beside it.
- **NW yard (z18, p10-farnw-z18):** A second drop yard at the NW corner with 3-4
  diagonal rows of parked trailers and adjacent employee car parking.
- **Gate (z20-21, p10-pinch-z20 / p10-booth-z21):** The decisive view — see below.

## 3. Gate / guard-shack / dock determinations

**Truck gate — TRUE (high confidence).** At the south junction (~44.0277, -70.3530)
where the private drive meets the yard, the z20 and z21 crops show a teardrop-shaped
**median island** with lane-channelization and **barrier / gate-arm markings** extending
laterally across both lanes. Truck lanes split around the island — a textbook controlled
truck checkpoint, not an open driveway.

**Guard shack — TRUE (high confidence).** The median island contains a small
**booth-sized structure** (~1-vehicle footprint, a clear roof shadow, sited between the
inbound and outbound lanes). Footprint and placement are consistent with a staffed guard
booth rather than the main building or an unmanned kiosk.

**Remote GS — FALSE.** A manned guard shack is present, so this is not a kiosk / call-box
remote check-in.

**Dock doors — 50+ (point estimate ~55).** The SW face carries one continuous dock bank
nearly the full ~500 m length of the building, trailers backed in along its entire run.
Exact bay rhythm is hard to tally across imagery tiles, so the count is flagged
uncertain, but it sits firmly in the 50+ band.

## 4. Yard zones and counts measured

- **Perimeter:** ~42 acres of cleared/paved footprint inside the treeline (oriented
  polygon traced to the NW-SE building axis and the wooded/pond boundary). Surrounding
  spring land is far larger but is forest, not yard.
- **Truck gate zone:** the median-island checkpoint on the south access drive.
- **Drop yards (2):** NW corner (~3-4 trailer rows) and south end (multiple long rows) —
  combined drop-area capacity in the 50+ band; `dropYard: true`.
- **Dock apron:** long thin quad hugging the SW dock face at the building's NW-SE angle.
- **Trailers visible:** ~80 (≈30-40 at docks, ≈25-35 south yard, ≈15-20 NW yard);
  practical trailer-parking capacity ~120 (estimate).
- **Building count:** 1 connected complex. **Rail:** none — road access only.
- **Scale:** none identified. **Multi-step:** false. **Ship/Rcv separate:** not
  confirmed (single long dock bank).

**Street View:** No coverage on the private property. Metadata at both the truck-gate
centroid and the perimeter centroid returns ZERO_RESULTS. The nearest public-road panos
(44.0268,-70.3529 and 44.0285,-70.3487, captured 2024-09) face only forest and the road,
not the gate, so both `streetViewMeta` zones are `hasCoverage:false`.

## 5. Web findings

Poland Spring's principal Maine bottling operation; brand owned by Primo Brands (NYSE:
PRMB) after the 2024 BlueTriton/Primo Water merger (prior owners: One Rock Capital /
Metropoulos 2021, Nestle before that). The plant draws from local springs and supplies
the Northeastern US. October 2025 reporting noted Poland Spring cut water use at several
Maine sites during drought — corroborates an active, large-scale facility. Setting is
rural South Poland, adjacent to the Poland Spring Resort.

## 6. Final confidence

**High.** Facility positively identified and the gate/guard-shack call is backed by clear
z20-z21 imagery of a channelized median-island checkpoint. Lower-confidence items (exact
dock-door count, ship/receive split, connectivity inference, capacity/acreage estimates)
are flagged in `uncertainFields` / `fieldNotes`.
