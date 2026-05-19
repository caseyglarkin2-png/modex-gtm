# Deep-Audit Dossier — Campbell's Soup, Napoleon OH

**Roster idx:** 2
**Type:** Manufacturing - soup/broth/V8 juice
**Address:** 12773 State Route 110, Napoleon, OH 43545
**Resolved center:** 41.397500, -84.103500
**Confidence:** medium

## Location confirmation
Roster coordinates landed inside the plant. Satellite probes z16-18 revealed a
very large industrial manufacturing campus on the south bank of the Maumee
River, with a big distribution warehouse on the NE, production halls along
SR-110 on the west, and a wastewater-treatment plant (multiple digester domes)
on the SW. This is the well-known Campbell's Napoleon soup/broth/V8 plant — one
of the company's largest. SR-110 (Scott Street / State Route 110) runs along
the west; an industrial connector road runs along the south.

## Key views
- **z16 wide:** Full campus — Maumee River north, big white-roof distribution
  warehouse NE, multi-building production complex center/west, trailer drop
  yards NE and along the south road, wastewater treatment SW.
- **z19 NE:** Dock banks with trailers backed in; large trailer drop yard.
- **z18 SW:** Wastewater treatment with geodesic-domed digesters — typical of a
  high-volume soup/broth plant.
- **Street View SR-110 / south road:** Continuous chain-link perimeter fence;
  employee parking visible behind the fence; rows of third-party carrier
  trailers (Western Express, Marten, Davis) parked along the south road.

## Gate / guard-shack determination
- **Truck gate: TRUE.** The campus is fully perimeter-fenced (confirmed all
  around on Street View). Truck access is via an internal driveway off the
  south industrial road / SR-110. A controlled gate is inferred.
- **Guard shack: FALSE (medium confidence).** No guard booth was positively
  identified on any public-road frontage — every Street View stretch along
  SR-110 and the south road showed employee parking behind fence or open yard,
  not a staffed booth. Classified `remoteGs: true` (kiosk / remote check-in)
  but flagged uncertain.
- Long internal driveway and large paved yard aprons -> `drivewayLong`,
  `postGateStaging`, `fastLaneOpportunity`.

## Yard zones and counts
- **Perimeter:** ~890 m N-S x ~830 m E-W -> ~175 acres.
- **Drop yards:** Large NE lot (130+ trailers, third-party carriers) plus a
  secondary row along the south road. Capacity ~200.
- **Dock aprons:** Dock banks on the NE distribution warehouse and central
  production buildings -> `shipRcvSeparate` (distinct clusters).
- **Dock doors:** ~55 estimated across the campus (banded 50+, low confidence).
- **Buildings:** 9+ distinct structures -> `multipleFacilities` true.
- **Rail:** No active rail spur into the property observed.

## Web findings
Campbell's Napoleon is a flagship soup, broth, and V8 juice plant (V8
production confirmed by Campbell's newsroom per roster). Rural setting — edge
of the small town of Napoleon, surrounded by farmland and the river.

## Final assessment
Medium confidence. Large multi-building manufacturing campus with extensive
trailer yards and full perimeter fencing. Gate is confidently present;
guard-shack vs remote check-in could not be resolved from imagery — flagged
uncertain. Dock count, entry/exit lanes, and scale also uncertain.
