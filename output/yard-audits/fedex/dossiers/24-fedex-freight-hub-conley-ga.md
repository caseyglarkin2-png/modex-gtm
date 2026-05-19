# Deep-Audit Dossier — idx 24

## FedEx Freight Hub - Conley GA (Atlanta, ATL)

**Type:** Freight LTL hub service center (~304 doors, one of the largest in the FedEx Freight network)
**Resolved coordinates:** 33.6510, -84.3388
**Confidence:** high

## Location resolution

The roster supplied address "4900 Welcome All Rd, Conley, GA 30288" and
coordinates (33.620745, -84.525293, flagged ROOFTOP). Step-0 satellite probes
at the roster coordinates showed a low-density residential subdivision in the
College Park / Camp Creek area — clearly not a freight facility. The roster
geocode was wrong despite the ROOFTOP flag.

Web research confirms the FedEx Freight ATL break-bulk hub is in the Conley GA
30288 industrial district (east of Hartsfield-Jackson, near Thurman Rd).
Satellite probes there revealed a large perimeter-fenced complex with a long
NW-SE cross-dock building and a vast trailer yard. Street View (captured
2025-02) from inside the visitor parking lot shows a 3-story FedEx Freight
office building and numerous FedEx-branded tractors and trailers, positively
identifying the site. Locked center: 33.6510, -84.3388.

## Key views

- **Wide satellite (z15-16):** Large rectangular industrial complex set back from
  public roads by tree buffers, surrounded by other distribution warehouses.
  Property roughly 813m (N-S) x 602m (E-W), ~121 acres.
- **Cross-dock (z18):** Long narrow break-bulk building running NW-SE with a
  dense regular rhythm of dock doors on both long faces, trailers backed in.
  3-story office at the NE end; large employee parking lot to the north.
- **Trailer yard (z17-19):** Enormous paved drop yard south and east of the
  cross-dock, holding hundreds of trailers and pup trailers without tractors.
- **Street View (2025-02):** Fenced visitor parking and office; FedEx Freight
  trailers and tractors visible; chain-link fence separates front parking from
  the secured truck yard.

## Gate / guard-shack / dock determinations

- **truckGate = true.** The whole ~121-acre property is perimeter-fenced; the
  truck yard is gated and separated from the front parking by an internal fence
  line. Truck gate position inferred on the north side near the office access
  corridor — not directly Street-View confirmed (all panos sit inside the
  visitor lot). Medium confidence on exact gate, high confidence one exists.
- **guardShack = true.** Not directly visible in available imagery. A ~304-door
  network-largest break-bulk hub is staffed-guard-controlled at the truck gate
  as a network standard. Classified true, medium confidence; remoteGs = false.
- **dockDoors = "50+".** Long cross-dock break-bulk building with dock doors on
  both long faces; cited in trucking forums as a ~304-door facility. A second
  long dock building sits to the east.
- **dropArea = "50+" / dropYard = true.** Dedicated trailer-storage lot covers
  most of the property; hundreds of parked trailers.

## Yard zones and counts

- **perimeter:** S 33.6475, W -84.3420, N 33.6548, E -84.3355 (~121 acres).
- **truckGate:** small box on the north access corridor near the office.
- **dropYards:** one large box covering the south/SE trailer yard.
- **dockAprons:** one box along the cross-dock building's south face.
- **staging:** post-gate apron between the gate corridor and the docks.
- **yardMetrics:** dockDoorCount ~304, trailersVisible ~360, capacity ~750,
  1 truck gate, 3 buildings, ~121 acres, not rail-served.

## Web findings

FedEx Freight service-center page (ccid=ATL) confirms a Conley GA 30288
location. Truckingboards LTL forum cites ATL as a ~304-door hub, one of the
largest break-bulk facilities in the FedEx Freight network.

## Final confidence

High on facility identity, layout, dock band, and drop-yard. Medium on the
exact truck-gate position and guard-shack (inferred from network norms and
fence lines, not a direct Street-View sighting of the booth).
