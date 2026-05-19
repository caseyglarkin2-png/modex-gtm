# Deep-Audit Dossier — John Deere Thibodaux (idx 14)

**Facility:** John Deere Thibodaux — Thibodaux, LA
**Type:** Assembly Plant (sugarcane harvesters, cotton stripper heads, scrapers, cane loaders)
**Roster address:** 1000 Coulon Rd (incorrect — see below)
**Resolved address:** 244 Highway 3266 (Plant 1) / 234 Highway 3266 (Plant 2), Thibodaux, LA 70301
**Resolved center:** 29.805705, -90.829764
**Confidence:** High

## Location confirmation (Step 0)
The roster coordinates (29.803849, -90.82531; RANGE_INTERPOLATED for 1000 Coulon Rd)
landed in a residential neighborhood — not the plant. The roster explicitly flagged
"multiple addresses exist, verify in deep-audit." Web research (Yelp, Waze, Panjiva,
Deere factory page) identified the real facility at 244 Highway 3266 (Plant 1) with a
co-located Plant 2 at 234 Highway 3266, founded 1965 as CAMECO Industries, now a Deere
subsidiary and the world's largest sugarcane-equipment manufacturer. Resolved
coordinates 29.805705, -90.829764 were confirmed by satellite — a large multi-building
manufacturing campus bordered by sugarcane fields to the west and north and a
residential pocket to the SE. Coordinates re-locked to the resolved point.

## Key views
- **Context (z16/z17):** Multi-building industrial campus on the NW edge of Thibodaux,
  surrounded by sugarcane fields; residential grid to the east/south.
- **Full complex (z17/z18):** Two large manufacturing buildings (Plant 1 + Plant 2)
  plus an office building and several support/storage structures; material laydown
  yards and equipment storage throughout.
- **West frontage (z19, Street View 2025-10):** Highway 3266 runs along the west; the
  John Deere office building fronts the road with an open parking lot. The access road
  runs directly into the complex between buildings — open, no barrier or booth.
- **East / SE (z18/z19):** Extensive material laydown yards (components, red storage
  containers), scattered docks, and ~10 trailers; an interior fence/drainage line on
  the east edge.
- **Building faces (z20):** Docks scattered on the N and SE faces with a few trailers
  backed in; no single rhythmic dock bank.

## Gate / guard-shack / dock determinations
- **truckGate = false.** Open campus. The access road off Highway 3266 runs directly
  onto the property between the office and manufacturing buildings; Street View
  confirms an open frontage with no barrier arm, sliding gate, or checkpoint pinch-
  point. An interior fence/drainage line runs along the east but no gate is confirmed.
- **guardShack = false / uncertain.** No standalone guard booth observed at the
  entrance; a staffed reception inside the office is plausible but unverified —
  flagged. remoteGs = false (no gate).
- **dockDoors = "10-25".** Docks scattered across the N and SE building faces with a
  few trailers backed in; estimated 10-25 (low confidence — finished harvesters
  largely ship by flatbed/drive-off, so dock counts are modest).
- **dropArea = "10-25".** ~10 trailers plus extensive material laydown in the SE/E
  yards.

## Yard zones and counts
- **Perimeter:** ~95 acres operational footprint (irregular parcel, larger with
  material yards).
- **Truck gate:** none.
- **Drop yards:** SE/E trailer + material laydown yard.
- **Dock aprons:** N face and SE face of the manufacturing buildings.
- **Staging:** internal paved yard between the buildings.
- **Metrics:** ~16 dock doors (est.), ~10 trailers visible, ~25 trailer capacity, 0
  truck gates, 8+ buildings, ~95 acres, no rail spur.

## Web findings
Deere factory page, Thibodaux Chamber, Dun & Bradstreet, and Panjiva confirm John Deere
Thibodaux as the world's largest sugarcane-equipment manufacturer, founded 1965 as
CAMECO Industries, building sugarcane harvesters, cotton stripper heads, scrapers, and
cane loaders. Panjiva references a "Plant 2" at 234 Highway 3266, confirming the
multi-building campus.

## Final confidence
**High.** The roster location error was identified and corrected; the resolved
facility is unambiguously the John Deere Thibodaux plant, and the open-campus layout
(no truck gate, no guard booth) is clearly confirmed by satellite and Street View.
Dock-door count and the guard-shack/reception detail are flagged as low-confidence.
