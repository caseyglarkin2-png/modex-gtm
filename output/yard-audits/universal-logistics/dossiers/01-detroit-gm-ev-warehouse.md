# Deep-Audit Dossier — idx 1

## Logistics Insight Corp — GM EV Parts Warehouse, Detroit MI

**Address:** 14250 Plymouth Rd, Detroit, MI 48227
**Resolved center:** 42.375600, -83.184600
**Type:** Value-Added Logistics Center / Sequencing Warehouse
**Confidence:** High

---

### Location confirmation

The roster coordinate (42.374891, -83.184189) landed on the SW side of a single
very large, brand-new rectangular distribution building running NW–SE. Web
research (Crain's Detroit Business, GM Authority, Automotive News) confirms the
identity: GM redeveloped the long-abandoned former AMC headquarters site at
14250 Plymouth Rd into a ~793,520 sq ft EV-parts warehouse, built by NorthPoint
Development LLC, GM-owned and operated by Logistics Insight Corp (LINC, a
Universal Logistics Holdings company). It feeds parts to GM Factory Zero
(Hummer EV, Silverado EV). The 2020 Street View along Plymouth Rd still shows
the historic AMC HQ tower that has since been demolished — the current warehouse
post-dates all available Street View coverage, so the truck-side analysis is
satellite-only. The building, its dock face, and its truck yard are all
consistent with a ~800k sq ft auto-parts logistics warehouse — positively
identified.

### Key views

- **Wide satellite (z16-17):** One long building, NW–SE orientation, on a
  fenced/bermed parcel between Plymouth Rd (south), an active rail line (NE),
  and a public park strip (west).
- **SW long face (z18-20):** The primary loading-dock run — trailers backed in
  at intervals along the entire length, with a continuous dock apron and a long
  striped trailer-parking lot running parallel to it.
- **North end (z18):** A secondary bank of dock doors along the building's
  north wall, with a car/employee parking lot beyond.
- **NE long face (z18):** Solid windowless wall along the railroad — no docks.
- **South face (z20):** The office / main-entrance face with a landscaped
  pedestrian plaza, flagpole circle, and car parking — not a truck face.

### Gate / guard-shack determination

- **truckGate = true.** A single controlled truck entrance off Plymouth Rd. The
  property is fully fenced and landscape-bermed; truck access is via a wide
  divided access drive that runs north into the SW truck yard. The site is a
  secured GM-owned EV-parts operation — a controlled gate is the correct call
  even though no barrier arm resolves at the public-road edge in current
  imagery.
- **guardShack = false / remoteGs = true.** No staffed-booth structure (1–3
  vehicle footprint) is resolvable at the entrance. For a new GM-owned secured
  parts site, access control is most plausibly a kiosk / call-box / badge
  gate rather than a manned shack. Flagged as a low-confidence absence.
- **multiStep = false.** No second checkpoint stage (scale house / second
  booth) visible after the gate.

### Yard zones and counts

- **Perimeter:** the fenced industrial parcel — ~68 acres (the adjacent public
  park strip on the west is a separate parcel and is excluded).
- **Drop yard:** a long striped trailer-parking lot parallel to the SW dock
  apron, holding parked trailers without tractors — dedicated drop yard,
  ~25-50 stalls, ~60 trailer capacity.
- **Dock aprons:** the SW long-face apron (primary) and the north-wall apron.
- **Dock doors:** continuous run on the SW long face plus a secondary bank on
  the north wall; NE long face is blank wall. Estimated ~100-120 doors → 50+
  band. Two physically separate dock banks → shipRcvSeparate = true.
- **Staging:** a paved holding area inside the gate before the dock apron →
  postGateStaging = true; the gate→dock approach is long (3+ truck queue) →
  drivewayLong = true.
- **Fast-lane opportunity:** the wide divided access drive and large open SW
  apron leave ample paved width for an express/bypass lane.
- **Rail:** an active rail line runs along the NE edge but no spur enters the
  property → railServed = false.

### Web findings

GM Authority / Crain's Detroit / Automotive News: ~793,520 sq ft warehouse on
the former AMC HQ site, $32M city TIF + $5.1M state brownfield incentives, 350
new jobs, GM-owned, LINC-operated, supplying GM Factory Zero EV production.
Universal/LINC also runs a ~1M sq ft Stellantis parts-sequencing plant on
Detroit's east side (idx 2).

### Final confidence

**High** — building and operator positively confirmed by multiple sources and
clear current satellite imagery. The only uncertain calls are the guard-shack
absence and the exact entry/exit lane counts (the new build post-dates Street
View coverage), flagged in uncertainFields.
