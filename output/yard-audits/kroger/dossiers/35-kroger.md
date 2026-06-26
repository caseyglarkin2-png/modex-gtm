# Deep-Audit Dossier — idx 35 · America's Beverage Plant (Kroger)

**Facility:** America's Beverage Plant (Beverage Plant)
**Address:** 1331 E Airport Freeway, Irving, TX 75062
**Resolved center:** 32.83960, -96.92740
**Method:** deep-audit · **Confidence:** high

## Step 0 — Location confirmation
The supplied coords (32.840131, -96.927737) landed on a large industrial complex
fronting E Airport Freeway (TX-183). Web search confirms 1331 E Airport Fwy is
Kroger's "America's Beverage Company" / Inter-American Products beverage
manufacturing plant (Kroger-brand soft drinks and bottled water). Satellite
(z16-18) shows a large beverage manufacturing + distribution complex: a big
white-roofed production/warehouse building, a south office building, and a
separate NE warehouse, surrounded by very large trailer drop yards — consistent
with a beverage plant. Silos/tanks (syrup/water) sit at the SW of the main
building. Locked center at 32.83960, -96.92740.

## Key views
- **z16/z17 overview:** complex bounded west by a creek/rail treeline, north by
  woods (~32.8414), east by the east trailer rows / NE building (~-96.9256) with
  an undeveloped grass parcel beyond, south by a grass buffer along E Airport Fwy.
- **z18-20 main building:** large rectangular warehouse, near N-S long axis,
  docks on the south and east faces; dense trailer rows north and east.
- **NE view:** main warehouse east wall has a dock apron with trailers backed in;
  a separate NE warehouse adds more docks. Massive trailer storage between.

## Gate / guard-shack / dock determinations
- **truckGate = false.** Single entrance driveway off the south frontage road
  (~32.8375, -96.9281), shared by trucks and employees. Street View (Oct 2025,
  pano `-tp296eUdBxs4nCn9yEvdA`) and z21 satellite show an open paved drive with
  only guardrails — no barrier arm, sliding/swing gate, or pinch-point at the
  public-road boundary. The drive runs a long way back across a grass field.
- **guardShack = false (uncertain).** No booth at the street entrance; the gabled
  structures at the top of the drive are employee-parking car canopies, not a
  guard shack. Any access control would be deep at the building face and is not
  visible; flagged uncertain.
- **remoteGs = false** (no gate, so N/A).
- **Docks = 50+ (~70).** Dock doors on the south + east faces of the main
  warehouse plus the NE building; shipping/receiving run from physically separate
  banks (shipRcvSeparate = true).

## Yard zones & counts
- **perimeter:** 7-vertex ring tracing the developed property inside the
  west treeline, north woods, east trailer line, and south frontage buffer.
  **siteAreaAcres ≈ 30.7** (developed footprint; excludes the east grass parcel).
- **truckGate zone:** the entrance funnel/apron at the south frontage drive.
- **dropYards:** two blocks — the dense north trailer field and the east trailer
  field. **dropArea = 50+**, ~220 trailers visible, ~300 capacity. dropYard = true.
- **dockAprons:** the east-wall apron of the main warehouse where trailers back in.
- **staging:** null (no clearly delineated pre-gate stall area; internal paved
  aprons serve as post-gate staging → postGateStaging = true).
- buildingCount 3 → multipleFacilities = true (campus). No rail spur into the
  site. No truck scale identified (uncertain). fastLaneOpportunity = true (wide
  apron / spare paved width).
- urbanRural = **Urban** (dense Irving/DFW-metro industrial fabric on TX-183).

## Web findings
Kroger "America's Beverage Company" / Inter-American Products beverage
manufacturing plant — Kroger-brand soft drinks and bottled water. Sources:
nmtccoalition.org (ABC Beverage Manufacturing), Waze/Yelp listings ("America's
Beverage Company, Kroger Manufacturing").

## Final confidence: HIGH
Imagery clear and facility unambiguous. Two fields flagged uncertain
(guardShack, scale) — possible interior security/scale not visible from
overhead or the road.
