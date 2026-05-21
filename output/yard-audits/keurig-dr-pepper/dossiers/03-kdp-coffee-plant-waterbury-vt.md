# Deep-Audit Dossier — KDP Coffee Plant, Waterbury VT

**Roster idx:** 3
**Facility type:** Manufacturing - Coffee (roster); operationally a corporate office / R&D campus
**Address:** 33 Coffee Lane, Waterbury, VT 05676
**Resolved coordinates:** 44.335800, -72.750500
**Confidence:** Medium

## Location confirmation
The roster pin (44.336491, -72.755118, APPROXIMATE) landed in downtown
Waterbury. Web research (VT Farm to Plate, Yelp, Waze) all place Keurig Green
Mountain at **33 Coffee Lane, Waterbury VT** — the Pilgrim Park office campus
~430 m SE of the roster pin. 2023 Street View confirms a multi-building office
campus with a landscaped entrance sign. Location locked at the Pilgrim Park
complex.

## Facility character — important finding
This site is the **legacy / original Green Mountain Coffee Waterbury location**,
but operationally it is a **CORPORATE OFFICE and R&D campus, not a freight or
distribution truck yard**. KDP's actual coffee production is consolidated at the
Essex Junction plant (roster idx 2). The Waterbury site presents essentially no
truck yard to audit.

## Key views
- **z17-z18 satellite:** Multi-story office buildings (some with rooftop solar)
  surrounded by large employee car-parking lots; landscaped grounds; residential
  and small-commercial neighbors. No dock banks, no trailer yards.
- **z20 satellite probes:** Repeated zooms on every building face show car
  parking only — the white objects near buildings are passenger cars, not
  trailers. A small cluster of box trucks/vans near one building appears to be
  service/parcel vehicles.
- **2023 Street View:** Office buildings, entrance sign, employee parking,
  landscaped lawns — unmistakably an office campus.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE.** Open driveways off Pilgrim Park Rd / Coffee Lane serving
  car parking lots. No barrier arm, gate, or checkpoint.
- **Guard shack: FALSE.** No guard booth anywhere on the campus.
- **Remote GS: FALSE.** No gate.
- **Dock doors: 0-10 band.** No meaningful loading-dock bank; at most a couple of
  small service/loading doors. `dropArea` NONE — no trailer drop yard.
- **Rail served: FALSE.** An active rail line (Waterbury Amtrak/NECR corridor)
  runs along the W edge, but there is NO spur into the property.

## Yard zones and counts
- **Perimeter:** The Pilgrim Park campus parcels. ~18 acres.
- **Truck gate / drop yards / dock aprons / staging:** none — left null/empty.
- **Building count:** ~4 office buildings (`multipleFacilities` true).
- `drivewayShort` true (no truck queue depth — minimal freight).

## Web findings
- VT Farm to Plate, Yelp, Waze: Keurig Green Mountain located at 33 Coffee Lane,
  Waterbury VT 05676.
- KDP's 2011-2012 buildout shifted large-scale roasting/K-Cup production to Essex
  Junction; Waterbury remains the legacy/corporate site.
- A separate Green Mountain Coffee Café & Visitor Center operated in the
  refurbished Waterbury train station (1 Rotarian Pl) — not this site.

## Final confidence
**Medium.** The location is unambiguous and well corroborated, but the site is a
corporate office campus with no real truck yard — there is little freight
infrastructure to classify with high confidence. Flagged as low YardFlow
relevance: gate, guard-shack, dock, and drop-yard determinations are all
negative because the physical truck-yard features simply do not exist here.
