# Pactiv Evergreen — Covington GA Plant (idx 22)

**Facility:** Pactiv Evergreen Foam Plant/Warehouse, 8170 Alcovy Rd NE, Covington, GA 30014
**Type:** Manufacturing Plant (Foodservice)
**Resolved coordinates:** 33.61225, -83.84620 (complex center)
**Confidence:** Medium

## Location confirmation

The roster coordinate (33.612211, -83.846698, ROOFTOP, flagged 251 m off)
landed on the correct industrial complex. Web search confirms Pactiv Evergreen
operates a "Foam Plant/Warehouse" at 8170 Alcovy Rd NE, Covington GA 30014
(Macrae's Blue Book, Chamber of Commerce directory, Yelp; 24/7 operation).
Street View at the Alcovy Rd frontage shows a building with a clearly legible
"Pactiv Evergreen" sign on the office front, with a flagpole — a positive ID.
This is a very large foam-manufacturing complex on the Alcovy Rd / I-20
corridor on the edge of Covington.

## What the imagery showed

- **Wide satellite (z16-17):** an enormous interconnected multi-section
  building — one of Pactiv's larger foam plants. Employee parking on the north
  along Alcovy Rd; a large truck/trailer yard on the southeast. A separate
  large warehouse/DC building sits to the east (not Pactiv).
- **Office front (Street View 2026-02):** "Pactiv Evergreen" branded office
  entrance, flagpole, set behind a grass buffer. A one-way / "DO NOT ENTER"
  sign near the frontage suggests directional entry/exit control.
- **Perimeter (Street View 2026-02, multiple headings):** a continuous
  chain-link perimeter fence wraps the complex; reddish privacy slats are
  visible along the SW and NW sides. Resin and water-process tanks along the
  west face confirm a foam thermoforming operation.
- **Truck yard (z18 SE):** a large drop yard between the Pactiv plant and the
  eastern neighbor — dozens of trailers parked in rows; more trailers along the
  south edge near a retention pond.
- **Entry:** the main plant access is the drive off the signalized Alcovy Rd
  intersection on the northeast. This internal entry road has no Street View
  coverage, and high-zoom satellite over the entry/office is overexposed.

## Gate / guard-shack determination

- **truckGate: TRUE.** The complex is fully enclosed by a continuous chain-link
  perimeter fence. A foam plant of this scale running 24/7 with full perimeter
  fencing has a controlled truck entrance — high confidence on the gate itself.
- **guardShack: FALSE (flagged uncertain).** No guard booth could be positively
  identified — the internal entry road has no Street View coverage and the
  satellite over the entry/office is overexposed. The call is made on visible
  evidence only; a staffed gatehouse cannot be ruled out for a plant this size.
- **remoteGs: TRUE (flagged uncertain).** Set true because a gate exists with no
  visible booth; uncertain because the gatehouse could not be inspected.

## Yard zones and counts

- **Perimeter:** the full fenced complex — ~52 acres, derived from the
  perimeter box.
- **Drop yard:** large SE trailer-storage yard plus south-edge overflow → "50+"
  band, `dropYard:true`.
- **Dock doors:** "25-50" band — an estimated ~40-50 doors distributed across
  the SE/east faces of the sprawling building (rough estimate; flagged).
- **shipRcvSeparate:** inferred true from the plant's scale (separate dock
  clusters on different faces likely); flagged uncertain.
- **Rail served:** FALSE — no spur enters the property.

## Web findings

Pactiv Evergreen Covington is a foam plant/warehouse, 24 hours a day / 7 days a
week (Chamber of Commerce, Macrae's Blue Book). Foam foodservice products
(plates, trays, cups). Part of Novolex since April 2025.

## Final confidence: MEDIUM

The facility is unambiguously identified (branded office sign) and the truck
gate is certain given full perimeter fencing. Confidence is held at medium
because the guard-shack determination, lane counts, and dock-door count could
not be verified — the plant's internal entry has no Street View coverage and
high-zoom satellite over the entry is overexposed. These fields are listed in
`uncertainFields`.
