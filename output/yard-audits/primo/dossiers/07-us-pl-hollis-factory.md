# US PL Hollis Factory - Deep Yard Audit

**Type:** Bottling plant (PL)
**Operator:** Primo Brands / BlueTriton / Nestle Waters (Poland Spring)
**Address:** 400 Killick Pond Rd, Hollis Center, ME 04042
**Locked coords:** 43.67630, -70.64190
**Maps (satellite):** https://www.google.com/maps/@43.67630,-70.64190,400m/data=!3m1!1e3
**Confidence:** high

---

## Location resolution

The supplied coordinates (43.5950, -70.6450) were ~9.5 km too far south. Satellite probes there (z14-z17) showed only the forested Killick Pond Estates residential subdivision - scattered houses and dirt roads, no industrial building. Geocoding the street address (400 Killick Pond Rd, Hollis ME 04042) through the Maps API returned 43.67630, -70.64120, which lands squarely on a single enormous white-roofed industrial building with a multi-hundred-trailer drop yard, a 50-acre solar farm to the SW, and frontage on Killick Pond Rd.

Web search confirms this is the **Nestle Waters / Poland Spring (now Primo Brands / BlueTriton) Hollis Factory**, opened 2000, described as the largest water bottling facility in the United States (12 bottling lines), with an adjacent 13 MW / 50-acre / 23,000-module solar array. Building center locked at 43.67630, -70.64190.

## Layout overview

A single, very large contiguous bottling/warehouse building rotated roughly 30-35 degrees off north (long axis running NW-SE). The dominant yard features:

- **NW (long) face:** the primary, full-length dock bank - trailers backed in nose-to-tail along the entire face.
- **NW drop yard:** a multi-acre trailer-storage lot with 8-10 long parallel rows of unhitched trailers (100+ parked).
- **SW approach lane:** a long, wide dedicated asphalt strip running SW from the dock area - a truck approach/staging/queue lane, with a large fan-shaped turnaround apron at its head.
- **SE:** the office vestibule, employee parking lot, and the single access drive off Killick Pond Rd.
- **SW (off-property):** the 50-acre solar array (excluded from the yard perimeter).

## Gate / guard-shack determination

**Truck gate: FALSE (high confidence).** Street View on Killick Pond Rd at the entrance (pano `d4G11FtE34bCPsE3YZTMCw`, captured Nov 2024) looking up the access drive shows a wide, fully open, paved entry with painted lane channelization but no barrier arm, no sliding or swing gate, and no perimeter fence at the road frontage - just open grass between the public road and the building. The painted island and hatched striping visible in the z20 satellite at the entry throat is lane-divider channelization, not a controlled checkpoint.

**Guard shack: FALSE (high confidence).** No booth-sized structure (1-3 vehicle footprint, multi-side windows) at the entrance in satellite (z19-z20) or Street View. The only small structures near the SE corner are an office vestibule attached to the main building plus light/sign poles.

**Remote GS: FALSE.** No gate present, so remote/kiosk check-in does not apply.

## Docks, trailers, yard

- **Dock doors: 50+** (`dockDoorCount` ~70 estimate). The NW face carries a continuous, full-length dock bank; z18-z19 crops show 30-50+ trailers backed at dock along this face alone. With a ~290 m face and ~12 ft door spacing, the count comfortably exceeds 50.
- **Drop area: 50+.** The NW drop yard shows 8-10 rows of ~10-15 trailers each - well over 100 parked trailers. Clearly the top band. `dropYard: true`.
- **Trailers visible: ~180** (30-50 at dock + 100+ in the drop yard + scattered in staging).
- **Trailer parking capacity: ~220.**
- **Post-gate staging: TRUE** - large internal apron plus the long SW approach lane inside the property before the docks.
- **Driveway long: TRUE** - deep approach drive + internal yard + SW lane hold 3+ trucks.
- **Fast-lane opportunity: TRUE** - very wide entry throat with painted islands and unused paved width, plus the long SW approach lane; abundant room to add an express/bypass lane.
- **Entry/exit: together** at a single SE access point off Killick Pond Rd; entry throat channelizes into ~2 in / 1 out (low-confidence lane counts).
- **Ship/Rcv separate: FALSE** (medium) - docks read as one combined bank on the NW face; no clearly separate second cluster identified.
- **Scale: FALSE** - no weigh pad / scale house in the truck path.
- **Rail served: FALSE** - road-only access, no spur.
- **Site area: ~62 acres** of operating footprint inside the treeline (building + drop yard + approach lane + parking + apron), excluding the separate 50-acre solar array and surrounding forest.

## Setting

**Rural.** The plant sits in forested York County hills on Killick Pond Rd, surrounded by woods, the solar farm, ponds/wetlands, and the residential estates to the south. Despite being rural it is a major 24/7 industrial plant on a paved arterial with on-site solar/utility infrastructure and Street View coverage, so `connectivityIssue: false` - modern cellular coverage expected.

## Web findings

- Largest water bottling facility in the US; opened 2000; 12 bottling lines producing 8 oz to 3 L formats (Poland Spring, Deer Park, Ice Mountain, Nestle Pure Life).
- Adjacent 13 MW / 50-acre / 23,000-module solar array (powering the plant; came online 2026).
- Operates 24/7; customer/overnight truck parking available on site.
- Now part of Primo Brands following the BlueTriton/Primo merger.

## Confidence

**High** on site identity, gate/guard-shack (open uncontrolled entry confirmed at ground level), dock band (50+), and drop-yard band (50+). Lower-confidence (flagged) on exact dock-door count, trailer counts, entry/exit lane counts, and ship/receive separation - all honest overhead estimates.
