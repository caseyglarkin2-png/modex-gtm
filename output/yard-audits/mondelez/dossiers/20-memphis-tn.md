# Deep-Audit Dossier — idx 20

## Nabisco Memphis Sales Distribution Center — Memphis, TN

### Resolved location
- **Roster supplied:** 35.1175, -89.9711 — a downtown-Memphis centroid
  roughly 16 km NW of the real site.
- **Resolved:** ~35.0184, -89.8695 — **5812 Distribution Drive, Memphis, TN
  38141**, in the SE Memphis (Lamar / Getwell) industrial corridor.
- **How confirmed:** Superpages/Yellowpages list "Nabisco, 5812 Distribution
  Dr, Memphis TN 38141"; Shelby County tax-assessor records (via city-data)
  list the **5812 Distribution Drive parcel owner as MONDELEZ GLOBAL LLC** —
  a strong, independent confirmation. Satellite then matched a fenced
  distribution warehouse at that point.
- **Confidence in location:** high.

### Facility type — office vs freight
This is a **genuine freight facility** — a single-story Nabisco/Mondelez
sales-distribution warehouse with an office front. Freight relevance is HIGH.

### What the imagery showed
- **z17-z19 satellite:** a long single-story distribution warehouse fronting
  Distribution Drive, on a fully chain-link-fenced parcel. A rail line runs
  E-W immediately along the south edge of the building.
- **z20 satellite:** a row of 5-6 tractor-trailers staged in the yard plus
  additional trailers along the north dock apron.
- **Street View (Distribution Dr, 2025-11):**
  - Looking **north** — a low office-fronted building behind chain-link
    fence (the DC's office face).
  - Looking **south** — a long warehouse wall with a **continuous bank of
    dock doors** facing the road, fenced, with a dock apron and staged
    pallets/trailers.
  - Walking the road — chain-link perimeter fence on the property frontage
    with a gate opening at the office entrance; **no manned guard booth
    visible**, only a small sign/kiosk at the entrance.

### Gate / guard-shack determination
`truckGate: true` — the property is fully fenced and entered through a
controlled gate off Distribution Drive. `guardShack: false`, `remoteGs: true`
— no staffed booth is visible at the gate, implying kiosk / call-box / phone
check-in. Both flagged in `uncertainFields` since a small booth could be
obscured by trees in the panos.

### Yard zones and counts
- **Perimeter:** ~7.5 acres enclosing the fenced parcel.
- **Dock apron:** along the north (Distribution Dr) face — `dockDoorCount ~22`,
  band **10-25**.
- **Drop yard:** north apron / yard holds trailers and tractors — capacity
  ~25, band **10-25**, `dropYard: true`.
- **railServed:** the adjacent rail line reads as a through-line with no spur
  into the property — classified `false`, flagged uncertain.
- Single building, no truck scale, no campus.

### Final confidence: high
Location is independently confirmed by tax-assessor ownership records, and the
warehouse / dock layout is clearly visible. Only guard-shack presence and rail
service carry minor uncertainty.
