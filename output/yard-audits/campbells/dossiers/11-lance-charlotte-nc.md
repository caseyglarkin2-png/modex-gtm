# Deep-Audit Dossier — Lance, Charlotte NC (idx 11)

## Facility
- **Name:** Lance - Charlotte NC (Campbell's Snacks)
- **Type:** Manufacturing - crackers/sandwich snacks (Lance crackers; Campbell's
  Snacks production campus)
- **Address:** 8600 South Boulevard / 8600 Crump Road, Charlotte, NC 28273
- **Resolved center:** 35.12180, -80.88450

## Location confirmation
Roster coords (35.121741, -80.884208, ROOFTOP, moved 3415 m) landed on the
correct campus. Satellite probes z16-z20 and Street View show a large
multi-building industrial campus. The **LANCE** water tower and the bakery
buildings are clearly visible in Street View, positively confirming the site.
Web research: Lance moved to this 108-acre South Boulevard site in 1962; it is
now the largest Campbell's Snacks manufacturing center (1,500+ regional
employees) — a ~700,000 sq ft cracker bakery plus distribution warehouses, a
mixing center, and a $10M office building opened May 2024.

## Key views
- **Wide / context (z16-17):** Sprawling 108-acre campus with 6+ large buildings;
  the LYNX Blue Line light rail runs along/through the east edge; campus is
  reached via a bridge road over the rail from South Boulevard.
- **Perimeter (Street View 2019-2025):** Continuous chain-link fence encloses the
  bakery building and yards; the LANCE water tower stands over the plant.
- **Perimeter road (z18-20):** Long stretches of the campus loop road are lined
  with parked trailers — extensive drop-yard storage.
- **Interior (z18-19):** Multiple buildings, dock banks, large employee parking
  lots, trailers throughout.

## Gate / guard-shack determination
- **truckGate: TRUE.** The campus is enclosed by a continuous chain-link
  perimeter fence (confirmed in multiple Street View years). Access is via a
  single bridge road off South Boulevard crossing the light-rail line. Web
  sources reference a "Campbell's Snacks Bakery Production Plant Entrance" sign.
  Treated as a controlled gated entry.
- **guardShack: TRUE (medium confidence — flagged uncertain).** A 1,500-employee
  Campbell's production campus with a dedicated plant entrance almost certainly
  has a manned gatehouse, but the specific booth could not be positively
  pinpointed: Street View covers the outer campus loop road, not the inner
  production-yard gate. Marked true on operational likelihood.
- **remoteGs: FALSE** (guardShack assumed true; flagged uncertain).

## Yard zones and counts
- **Perimeter:** ~108 acres (published figure); box {S 35.11850, W -80.88950,
  N 35.12480, E -80.88100}.
- **truckGate box:** the campus access road where it enters the fenced area.
- **dropYards:** three boxed — perimeter-road trailer rows and two interior lots.
- **dockAprons:** two boxed — bakery dock bank and a distribution-building bank.
- **yardMetrics:** dockDoorCount ~70 (50+ band, aggregate across buildings),
  trailersVisible ~95, trailerParkingCapacity ~160, 1 main truck gate,
  6+ buildings, 108 acres, not freight-rail-served (passenger light rail only).

## Web findings
Lance / Campbell's Snacks, 8600 South Boulevard (Crump Road), Charlotte —
largest Campbell's Snacks manufacturing center; ~700,000 sq ft Lance cracker
bakery on a 108-acre campus occupied since 1962; Campbell's acquired
Snyder's-Lance in 2018; $10M Charlotte investment including a 2024 office
building and multi-year plant upgrades.

## Final confidence
**Medium.** The facility is positively identified and the fenced campus
perimeter is confirmed, but the exact gate/guard-booth structure and the
aggregate dock/trailer counts are estimates from a very large multi-building
campus. truckGate is high-confidence; guardShack is an operational-likelihood
call flagged as uncertain.

### 3-line summary
- Gate verdict: YES — fenced 108-acre campus, single controlled access road.
- Guard-shack verdict: LIKELY YES (manned plant entrance) — flagged uncertain.
- Confidence: medium.
