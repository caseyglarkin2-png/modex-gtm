# PFG idx 9 — Performance Foodservice - Dallas Fort Worth (Fort Worth TX)

**Facility:** Performance Foodservice - Dallas Fort Worth (new cold-storage DC)
**Address:** 5401 E 1st St, Fort Worth, TX 76103
**Type:** Broadline Foodservice Distribution Center (cold storage)
**Locked coordinates:** 32.767167, -97.265073
**Confidence:** Medium

## Location confirmation

The roster supplied 32.767167, -97.265073 (ROOFTOP geocode, 58 m moved). Google's
overhead satellite imagery of that exact point still shows a graded but empty
greenfield site — the imagery predates the building. Resolution therefore relied on
Street View and project records:

- **Street View (Jan 2025)** at the roster point, looking south across E 1st St,
  shows a large white industrial building under final construction directly behind a
  stone-faced retaining wall — an office/admin front elevation with a dock-area wing
  visible to the west. This is the new PFG DC.
- **Project records:** TDLR project "Scannell - PFG Dallas" (TABS2024004778) — a new
  cold-storage food distribution facility with office space, 343,000 sq ft, owner
  SP White Ft. Worth JV LLC, start Nov 2023, completion June 2025, status "Inspection
  Complete." ARCO National Construction's completion announcement describes a
  355,000 sq ft cold-storage facility for PFG with 69,000+ sq ft of -10°F freezer,
  ~46,000 sq ft cooler, a 1,600 sq ft -20°F ice-cream freezer, and 50-ft clear
  height. Developer: Scannell Properties.

The roster coordinate is correct; only the overhead imagery is stale. Because the
yard was still under construction in all available imagery, yard-detail fields are
estimates and broadly flagged.

## What the imagery showed

- **Satellite (z15-z18, current):** Graded greenfield at the roster point; nearby
  industrial / oilfield-services pads and lay-down yards, but no completed DC. The
  building is not yet captured in Maxar/Airbus imagery.
- **Street View (Jan 2025):** Large white DC building under final construction behind
  a partly-built stone retaining wall, with a defined site entry off E 1st St. Gate
  hardware not yet installed/resolvable. Office front faces the road; dock wing to
  the west.

## Gate / guard-shack / dock determinations

All gate determinations are **medium-confidence inferences** — the gate could not be
directly observed because the site was still under construction.

- **truckGate: true (uncertain)** — a 2025-vintage build-to-suit cold-storage food DC
  of this class is essentially always delivered with a controlled, fenced truck
  entrance. The Street View shows a defined site entry and an in-progress perimeter
  wall.
- **guardShack: false (uncertain)** — no booth structure was visible; modern food DCs
  of this generation typically use kiosk/camera/app check-in.
- **remoteGs: true (uncertain)** — assumes a controlled gate with remote/kiosk
  check-in and no staffed booth, the standard pattern for this DC class.
- **dockDoors: 50+ (uncertain)** — a 343,000-355,000 sq ft cold DC of this scale
  typically carries 50+ dock doors; exact count not verifiable.
- **dropArea: NONE / dropYard: false (uncertain)** — no trailers visible because the
  yard was unbuilt in available imagery; the finished facility will have a truck
  court and trailer parking that could not be measured.

## Yard zones & counts

- **Perimeter:** drawn around the construction parcel / building footprint as seen
  from the road; secondary zones left null because the yard layout is not yet
  observable.
- **yardMetrics:** ~60 dock doors (estimate), 0 trailers visible (under
  construction), ~100 trailer capacity (estimate), 1 truck gate, 1 building, ~40
  acres, not rail-served — all estimates given the construction-phase imagery.

## Web findings

- 5401 E 1st St = Performance Foodservice - Dallas Fort Worth, a new build-to-suit
  cold-storage DC. PFG-Dallas also operates as "PFG (Roma)". TDLR: 343,000 sq ft,
  $68.2M, completed/inspected June 2025. ARCO: 355,000 sq ft, multi-temp (freezer,
  cooler, ice-cream freezer), 50-ft clear. Developer Scannell Properties; GC ARCO
  National Construction.

## Final confidence: Medium

The facility is positively identified (Street View + project records) and the
location is correct, but the building was still under construction in all available
imagery, so the truck gate, guard shack, dock count, and all trailer-yard fields are
inferences flagged in `uncertainFields`. A re-audit once fresh post-completion
satellite imagery is published would upgrade this to high confidence.
