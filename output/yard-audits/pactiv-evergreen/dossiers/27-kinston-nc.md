# Pactiv Evergreen — Kinston, NC Plant (idx 27)

**Address:** 1447 Enterprise Blvd, Kinston, NC 28504
**Type:** Manufacturing Plant / Distribution — Foodservice paper packaging (ex-Dopaco facility)
**Locked coordinates:** 35.271813, -77.667863
**Confidence:** High

## Location resolution — geocode was wrong

The roster geocode (35.262664, -77.581635, **APPROXIMATE**, moved 2103 m) landed
in **downtown Kinston** — the wrong place. The roster address also reads
"Enterprise Rd"; the correct street is **Enterprise Blvd**, in the Lenoir County
industrial park **west of Kinston**, near West Pharmaceutical Services (1028
Enterprise Blvd) and Sanderson Farms.

Resolution path:
- Web search established Enterprise Blvd is in the Lenoir/Kinston industrial
  park; property listings (LoopNet, Reonomy) give 1447 Enterprise Blvd as a
  ~400,000 SF industrial building, built 1994, on a 23.02-acre site.
- clustrmaps lists a prior occupant **"Dopaco Inc"** — a paper / foodservice
  packaging company absorbed into the Pactiv / Reynolds Group family, confirming
  this is the right packaging plant.
- A property listing cited ~35.271813, -77.667863; satellite there shows a large
  white-roofed plant matching the 400,000 SF footprint.
- Fresh 2026-03 Street View on Enterprise Blvd shows the plant with office front
  and a flag display — positive ID.

Locked center: **35.271813, -77.667863**.

## What the imagery showed

- **Enterprise Blvd frontage (2026-03 Street View, multiple headings):** office
  front, flagpoles, employee parking, open lawn — **no perimeter fence, no
  gate**.
- **Plant building (satellite z17-z18):** one large rectangular white-roofed
  plant; employee parking on the SW front.
- **East face (satellite z19-z20 + 2026-03 Street View):** a long dock bank
  under a canopy with many dock doors and dry/refrigerated trailers backed in,
  fronting an open paved dock apron with a yard tractor.
- **East / north corridor (satellite z18-z19):** a rail line runs adjacent to
  the property with a grade crossing on Enterprise Blvd; no spur enters.
- **Front parking island:** a small portable office/storage trailer — not a
  guard booth.

## Gate / guard-shack determination

- **truckGate: false.** Open campus. The 2026-03 Street View shows no fence and
  no gate; the road runs open right up to the east dock apron and front parking.
- **guardShack: false.** No staffed booth anywhere; the small structure on the
  front grass island is a portable office/storage trailer.
- **remoteGs: false.** No gate present.

## Yard zones and counts

- **Perimeter:** set to the cited 23.02-acre site (~430 m N-S x ~350 m E-W).
- **Truck gate:** none — left null.
- **Dock apron:** along the east building face.
- **Drop yard:** the east paved yard beside the dock bank.
- **dockDoorCount ≈ 30** (banded 25-50; long canopied dock bank, exact count
  soft).
- **trailersVisible ≈ 18**, **trailerParkingCapacity ≈ 50**.
- **railServed: false** — adjacent rail line, no spur into the plant.

## Web findings

Pactiv LLC / Pactiv Evergreen foodservice paper-packaging plant; ~100 employees;
parent Reynolds Group Holdings; prior occupant Dopaco Inc. Driver-facing notes
mention overnight truck parking on site. The 400,000 SF building was built in
1994 on 23.02 acres in the Lenoir County industrial park.

## Final confidence

**High.** The roster geocode was wrong (downtown, 2.1 km off) but the facility
was positively re-located on Enterprise Blvd via property listings + the Dopaco
prior-occupant link + fresh 2026-03 Street View. Layout, open frontage, and the
east dock bank read clearly. Dock-door count and lane counts are the soft
figures (flagged in uncertainFields).
