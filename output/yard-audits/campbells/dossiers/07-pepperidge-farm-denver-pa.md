# Deep-Audit Dossier — Pepperidge Farm, Denver PA

**Roster idx:** 7
**Type:** Manufacturing - bakery (baked goods and cookies)
**Address:** 1 Pepperidge Farm Drive, Denver, PA 17517
**Resolved center:** 40.222800, -76.085500
**Confidence:** medium

## Location confirmation
Roster coordinates landed inside the plant footprint. Satellite probes z16-18
revealed a large industrial bakery near a highway/PA-272 interchange, with
employee parking on the SW, a trailer drop yard on the SE, and dock banks along
the SE building face. Street View at the entrance confirmed a Pepperidge Farm
monument sign on the private entrance road. This is the 611,000 sq ft
Pepperidge Farm Denver PA bakery (opened 1991, baked goods and cookies).

## Key views
- **z16/z17 wide:** Large bakery building, employee parking SW, trailer drop
  yard and dock banks SE, set back from the highway behind a wooded buffer.
- **z19/z20 SE:** Dock banks with trailers backed in along the SE face plus a
  large trailer drop yard (60-70+ trailers in rows).
- **Street View (Pepperidge Farm Drive):** Private entrance road off the public
  road with a Pepperidge Farm monument sign; a posted "TRUCKS" directional
  sign separating truck and car routes; lane markings; chain-link fence visible.

## Gate / guard-shack determination
- **Truck gate: TRUE.** Single private entrance road (Pepperidge Farm Drive)
  off the public road. The entrance is a designed checkpoint with a monument
  sign, lane markings, and a posted "TRUCKS" sign routing trucks separately
  from cars. A controlled gate is inferred inside the property.
- **Guard shack: FALSE (medium confidence).** No guard booth visible at the
  public-road junction; the plant is set back. Classified `remoteGs: true`,
  flagged uncertain.
- **entryExitSeparate: TRUE.** The "TRUCKS" directional sign at the entrance
  splits truck traffic onto a separate route from car/visitor traffic.
- Long private entrance drive -> `drivewayLong`; truck/car lane separation and
  a wide apron -> `fastLaneOpportunity`.

## Yard zones and counts
- **Perimeter:** ~870 m N-S x ~720 m E-W -> ~95 acres.
- **Drop yard:** Large SE-side lot with 60-70+ trailers; capacity ~110.
- **Dock aprons:** Dock banks along the SE building face.
- **Dock doors:** ~45 estimated (banded 25-50, low confidence).
- **Buildings:** Single large bakery building -> `multipleFacilities` false.
- **Rail:** No rail spur into the property.

## Web findings
Pepperidge Farm Denver PA is a 611,000 sq ft bakery opened in 1991, producing
baked goods and cookies (Encyclopedia.com, Food Processing per roster). Setting
is edge-of-town / rural — Denver is a small PA borough; the plant sits beside a
highway interchange amid woods and farmland with adjacent residential
development.

## Final assessment
Medium confidence. Large single-building cookie/baked-goods bakery with a sizable
SE trailer drop yard and a designed truck/car-separated entrance off a private
drive. Guard-shack vs remote check-in and exact lane counts flagged uncertain.
