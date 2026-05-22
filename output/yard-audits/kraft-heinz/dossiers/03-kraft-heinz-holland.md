# Kraft Heinz - Holland (MI) — Deep Audit

**Address:** 431 W 16th St, Holland, MI 49423
**Resolved coords:** 42.7836, -86.1283
**Maps:** https://www.google.com/maps/@42.7836,-86.1283,400m/data=!3m1!1e3
**Archetype:** #3 — No Gate / No Guard Shack (confirmed)
**Method:** Satellite (Maxar 2026) + Street View (Google, 2024-06) + web research
**Confidence:** high

## Location confirmation

The Holland Kraft Heinz plant sits on the south shore of Lake Macatawa, just
inside the City of Holland. Public records (West Coast Chamber of Commerce,
Holland Museum, Crain's Grand Rapids) confirm the address as **431 W 16th St**
and identify the plant as historically Heinz's Holland pickle & vinegar works
— widely cited as the world's largest pickle plant. Kraft Heinz announced a
$17M expansion (50 jobs) for the site and a more recent $13M clean-energy
upgrade. The product mix today still centers on pickles, relish, and vinegar,
with Lunchables / specialty-meal lines pulled in via Kraft Heinz's broader
network.

Probed satellite (z16–z21) around 42.7835, -86.1282 confirms the correct
building: a lakeside industrial complex with the distinctive **rows of round
pickle/brine tanks** on the north side, multiple connected production blocks,
and a large eastern trailer drop yard. The Heinz "57" red sign on the
south-central office facade was visible in 2024-06 Street View.

## Key views

- **Wide (z16):** plant occupies the entire SE shoreline cape of Lake
  Macatawa; bounded south by W 16th St, north/west by the lake, east by
  Kollen Park greenspace and a rail spur.
- **z18/z19 overhead:** identifies four building masses (NW production block,
  central process building, south dock building, north shoreline tank/process
  hall) and the eastern drop yard.
- **z20 over east drop yard:** clear count of 50+ trailers in 5-6 rows; a
  blue-cab tractor was actively spotting a trailer in the captured frame
  (operational drop-yard usage).
- **z20 over west dock face:** ~10-12 trailers backed against the NW building.
- **Street View 2024-06 along W 16th St (multiple pano locations):**
  uninterrupted view of the south property line — no fence, no guard booth,
  no barrier gate, no kiosk. The plant's south frontage flows directly from
  the public curb-cuts into dock aprons and the drop yard. An XTRA-Lease
  trailer was photographed staged curbside, reinforcing the open-access
  character.
- **NE corner (z19):** a rail spur enters the property from the east-side
  right-of-way and curves NW into the north tank field — confirms
  `railServed: true`.

## Gate / guard-shack / driveway determination

- **`truckGate`: false.** No barrier arm, sliding/swing gate, or fenced
  pinch-point anywhere on the property line. Every truck driveway is an
  open curb-cut directly off W 16th St into the working yard.
- **`guardShack`: false.** No small staffed booth (1-3 vehicle footprint,
  multi-side windows) was observable at any of the curb-cuts or interior
  decision points. The office building (red Heinz 57 sign) is a normal
  admin/visitor entrance, not a guard checkpoint.
- **`remoteGs`: false** — because there is no truck gate, not because a
  kiosk replaces a shack.
- **`drivewayShort: true`, `backupSensitive: true`:** the gap between the
  curb of 16th St and either the dock apron or the east drop yard is
  short — well under three truck lengths. A real queue would spill onto
  the public street.
- **`entryExitTogether: true`, `entryLanes: 1`, `exitLanes: 1`:** with no
  formal gate, in/out share the same curb-cuts; each curb-cut is roughly
  single-lane in each direction.
- **`scale: false`, `multiStep: false`:** no truck scale or second
  checkpoint visible.

## Yard zones & counts

| Zone | Notes |
|---|---|
| Perimeter | bbox south 42.7826 / north 42.7848 / west -86.1308 / east -86.12585 |
| Truck gate | SE curb-cut cluster, bbox listed in JSON (open access, but the dominant truck-flow point) |
| East drop yard | One large bbox holding 50-65 parked trailers |
| Dock aprons | Two: (a) west face of NW building, (b) east face of central building serving the east drop yard |
| Staging | None — no formal staging area inside or outside any gate |

**Metrics (estimates from overhead imagery):**

- `dockDoorCount`: ~35 (band 25-50)
- `trailersVisible`: ~70 (50+ in east drop yard + ~12 west + ~9 south)
- `trailerParkingCapacity`: ~90 (east yard is not fully packed in the
  capture; 5-6 rows × ~15 stalls)
- `truckGateCount`: 2 (functional curb-cut clusters, not gated)
- `buildingCount`: 4
- `siteAreaAcres`: ~24.5 (245 m × 405 m)
- `railServed`: true (rail spur curves in from the east ROW)

## Classification flags worth highlighting

- `shipRcvSeparate: true` — distinct dock banks on three different building
  faces strongly imply separate shipping and receiving operations, normal
  for a multi-line food plant. Flagged uncertain (`shipRcvSeparate` listed
  in `uncertainFields`) because we cannot verify the internal floor plan.
- `multipleFacilities: false` — the four building masses are contiguous on
  a single parcel, so this reads as one integrated plant rather than a
  multi-building campus.
- `urbanRural: Urban` — Holland is a small city, but the plant sits inside
  the dense urban fabric of downtown Holland (marina, retail, residential
  immediately south across 16th St), so Urban is the right call. (The
  pre-existing stub had this as Rural; this audit corrects it.)

## Web findings

- Holland Museum exhibition: "Heinz in Holland: A Story with Heart" —
  pickles produced here since 1897.
- Crain's Grand Rapids: $13M clean-energy upgrade project announced for the
  Holland plant.
- Trade & Industry Development: prior $17M expansion / 50-job announcement
  for the Holland facility.
- D&B / Bandana / Yellow Pages: confirm 431 W 16th St as the operating
  address; references to a security guard and dock receiving team — but
  there is no physical guard shack at the curb; security is presumably
  inside the office building, not at any gate.

## Final verdict

- **Gate verdict:** No truck gate. Open curb-cuts off W 16th St.
- **Guard-shack verdict:** No guard shack at the curb.
- **Confidence:** high. Satellite and 2024-06 Street View agree
  unambiguously; the only field with notable uncertainty is
  `shipRcvSeparate` (and the precise count of inbound/outbound lanes at
  each curb-cut). This site is a textbook `#3` open-access food
  manufacturer — the same archetype the Holland plant serves as a
  reference example for in `classify-prompt.md`.
