# Deep-Audit Dossier — John Deere Waterloo Works, Engine Works (idx 2)

**Facility:** John Deere Waterloo Works - Engine Works
**Type:** Engine Plant
**Address:** 3801 W Ridgeway Ave, Waterloo, IA 50704
**Locked center:** 42.4678, -92.4330
**Gate verdict:** Truck gate YES (inferred, medium confidence) · Guard shack NO (remote check-in)
**Archetype family:** Gate, no guard shack — remote check-in
**Confidence:** medium

## Location confirmation
Roster supplied ROOFTOP coordinates (42.468191, -92.433528) moved 351 m — these landed
directly on a long (~900 m) single-mass industrial building. Confirmed as the John Deere
Waterloo Works Engine Works at 3801 W Ridgeway Ave. Locked center refined slightly to
42.4678, -92.4330 on the building centroid.

## What the key views showed
- **z16/z17 overview:** One very long industrial building, employee parking lots on the W
  and E sides, W Ridgeway Ave running E-W along the north frontage, I-380 to the SW. Large
  open grass land south of the building.
- **z19 main entrance (42.469,-92.4325):** Circular visitor drive with a flagpole and the
  main building front — office/visitor entrance, an open driveway off W Ridgeway Ave with
  no gate.
- **z19/z20 SE truck yard (42.4673,-92.4297):** Truck docks along the south building face,
  container/material-storage racks, ~14 trailers (blue/teal/green) backed in or parked.
  A continuous perimeter fence line is clearly visible.
- **z20 south dock face:** ~16 dock doors with several trailers backed in.
- **Street View:** Coverage exists on W Ridgeway Ave (north frontage) and a side road to
  the east. The truck yard sits well back behind a wide grass buffer; no SV pano reaches
  the truck-yard entrance, so a barrier arm could not be directly imaged.

## Gate / guard-shack / dock determinations
- **Truck gate (true, medium):** The whole property is clearly fenced (continuous fence
  line at z19-z20). The truck yard is at the SE building corner, reached by a private
  driveway loop set back from the road. Classified true; flag listed uncertain because SV
  cannot reach it.
- **Guard shack (false):** No staffed booth identified. The small blue-roof structure at
  42.4669,-92.4298 is a utility/pump building off in a grass area, not at the gate
  pinch-point. remoteGs set true by rule (gate present, no guard shack).
- **Docks:** ~16 doors on the south building face — band 10-25. Single dock cluster, so
  ship/receive not physically separate.
- **Driveway:** Long private driveway loop into the SE yard — holds a 3+ truck queue.

## Yard zones and counts
- **Perimeter:** ~95 acres (S 42.4620 / W -92.4400 / N 42.4710 / E -92.4290) — the long
  building, two parking lots, the SE truck yard, and a large open grass parcel south.
- **Drop yard:** Small SE yard with ~14 trailers and material racks; no dedicated multi-row
  trailer-storage lot (dropArea band 0-10, dropYard false).
- **Dock apron:** Strip along the south building face.
- **Truck gate count:** 1.
- **Rail:** No rail spur into the property.

## Web findings
Iowa DNR Facility Explorer and Yelp confirm the Engine Works at 3801 W Ridgeway Ave,
co-located within the broader Waterloo Works complex; produces John Deere PowerTech
engines.

## Final confidence
**medium** — location and layout are clear and well-imaged, but the truck gate and the
absence/presence of a guard shack could not be directly confirmed because Street View does
not reach the SE truck yard. Gate flags, lane counts, post-gate staging and drop-area band
are flagged uncertain.
