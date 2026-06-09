# Deep-Audit Dossier — Target Food Distribution Center, West Jefferson OH (T3804/T3880)

**Address:** 42 Commerce Pkwy, West Jefferson, OH 43162
**Resolved center:** 39.94645, -83.35120
**Confidence:** medium
**Method:** deep-audit (satellite + Street View + web)

---

## 1. Location confirmation

The supplied geocode (39.946572, -83.351404) landed on the correct building — the
large white-roof warehouse with an attached east office and an employee lot. I
confirmed this is the **Target FOOD distribution center** (438,000 sf, opened 2014,
refrigerated/frozen/produce) and NOT a neighbor:

- Web research: Target's food DC is at **42 Commerce Pkwy**, 438,000 sf on a 47-acre
  parcel, adjacent to Target's regional/general-merchandise DC. Target's internal id
  for the **food** DC is **T3880**; **T3804** (in the task title) is the adjacent
  **regional** DC. Both are on the same logistics park.
- Street View disambiguation: the long building immediately **south** carries a
  JLL / Stonemont marketing banner reading **"Available — 44 Commerce Parkway,
  1,090,000 s.f."** — a vacant spec warehouse. That fixes 42 Commerce Pkwy as the
  audited center building (the one between the regional DC to the north and the
  44 Commerce spec building to the south).
- The giant building to the north with the massive trailer yard is the regional DC.

Surroundings: edge-of-town logistics park off I-70 / SR-29, ringed by farmland and
retention ponds → **Rural**.

---

## 2. Key views

| View | File | What it showed |
|------|------|----------------|
| Campus wide z14/z15 | campus-wide-z14, campus-z15 | Multi-building logistics park; Target regional DC (N) + food DC (center) + 44 Commerce spec bldg (S). |
| Food DC parcel z16 | parcel-z16 | Food DC = warehouse block + attached E office + employee lot; docks on NORTH face into shared trailer yard. |
| Food DC z17 | fooddc-z17 | Building footprint, north dock line, east office/parking, SE retention pond. |
| North docks z18 | northdocks-z18 | Long dock-door rhythm on the north wall with trailers backed in; hundreds of trailers in the shared drop yard beyond. |
| South/west wall z19 | southdock-z19 | Blank wall + rooftop refrigeration units; NO docks on the south/west face. |
| SE office/structure z19/z20 | yard-entry-z19, sebooth-z20 | Employee lot + a small tan-roof utility building by the pond (not a truck-lane guard booth). |
| NE yard entry z18/z20 | fooddc-yardentry-z18, egate-z20, culdesac-z20 | Yard/dock apron meets the campus interior drive; paved entry + cul-de-sac turnaround. |
| Street View (rural perimeter) | sv-swcorner, sv-west-e, sv-se-w | Public coverage only on rural perimeter roads; sv-se-w shows the 44 Commerce "Available" banner. |

---

## 3. Gate / guard-shack / dock determinations

**Truck gate — TRUE.** The yard is fenced and access-controlled. The fence
contractor (Lannis Fence Co., who built the food DC enclosure) documents
"over 2,000 feet of chain-link security perimeter fence with a **fully equipped
operated entrance gate and access controls system**," plus a decorative steel
ornamental gate at the employee/office entrance. The truck entry sits at the NE
corner where the food DC apron meets the campus interior drive.

**Guard shack — FALSE (medium confidence).** No staffed booth was visible at any
truck lane in satellite imagery. The only small detached structure (tan roof,
~1-car footprint) sits beside the SE retention pond, off the truck path — reads as
a utility/pump building, not a gatehouse. Contractor language emphasizes an
"access controls system," not a manned booth.

**Remote gate system (remoteGs) — TRUE.** Gate present + no guard booth ⇒ kiosk /
card / app access control. Consistent with the documented "access controls system."

**Docks.** Single dock bank on the **north** face only (facing the shared trailer
yard); ~40-50 doors across the ~700 ft wall of this 438k sf refrigerated DC → band
**25-50**. South/west walls are blank (rooftop refrigeration). No second dock
cluster ⇒ **shipRcvSeparate = false**.

---

## 4. Yard zones & counts

- **perimeter** — oriented 7-vertex ring around the fenced food-DC operation
  (building + north apron + east office/lot + SE pond). Traced ≈ **30.7 acres**
  (published parcel is 47 ac including undeveloped buffer + shared-yard share).
- **truckGate** — rotated quad at the NE yard entry off the campus drive.
- **dropYards** — one ring over the shared trailer drop yard north of the docks
  (hundreds of trailers; dropArea **50+**, dropYard true).
- **dockAprons** — long thin quad hugging the north dock wall at the building angle.
- **yardMetrics:** dockDoorCount ≈ 45, trailersVisible ≈ 220, capacity ≈ 350,
  truckGateCount 1, buildingCount 1, siteAreaAcres 30.7, railServed false.
- **scale** false (no weigh pad in the truck path). **multipleFacilities** false
  (single building on the food-DC property). **multiStep** false.

**Street View meta:** best driver's-eye pano = `ZO10oCf_QQCnIYI9UWZ35Q`
(39.94386, -83.34901, captured 2024-08) on the SE perimeter road — heading 7° toward
the truck gate, 329° toward the perimeter. Campus interior has no Street View.

---

## 5. Web findings

- Target corporate (2012 announcement) + Madison County Chamber: food DC at
  42 Commerce Pkwy, 438,000 sf, 47 acres, opened 2014, serves OH + 9 states,
  handles produce / refrigerated / frozen / packaged foods. Internal id T3880.
- Lannis Fence Co. project page: 2,000+ ft chain-link security perimeter fence,
  operated entrance gate + access controls system, ornamental gate at the office.
- Street View: 44 Commerce Pkwy (1.09M sf) immediately south is a vacant spec
  building (JLL/Stonemont), confirming the audited building's identity.

---

## 6. Confidence

**Medium.** Building identity is certain (corroborated by the 44 Commerce banner and
parcel research) and the truck gate is well-supported by the fence-contractor record.
The guardShack=FALSE / remoteGs=TRUE call rests on the absence of a visible booth plus
"access controls system" language, but the interior truck gate is not directly visible
in Street View (rural perimeter coverage only), so the gate/guard fields are flagged
uncertain. Dock-door band and lane counts are honest overhead estimates.
