# US PL Denver Factory - Deep-Audit Dossier

**Idx 15 | Scope: BT-active | Type: Bottling plant (PL) (physically a DC/delivery branch)**
**Resolved center: 39.7806, -104.8527** | [Maps](https://www.google.com/maps/@39.7806,-104.8527,400m/data=!3m1!1e3)

## Location resolution
The roster address 11700 E 47th Ave, Denver CO 80239 resolves (ROOFTOP geocode) to a large multi-tenant cross-dock distribution warehouse in Gateway Park, Denver, not a standalone bottling plant. Primo Brands / ReadyRefresh operates here as a distribution/delivery branch (Yelp and Nextdoor confirm ReadyRefresh at this address). The eastern building that the rooftop geocode lands on was audited, with its east and west truck yards. The supplied reference lat/lng (39.7392, -104.9903) is downtown Denver and was discarded.

## Key views
- Satellite z17-20 of the eastern cross-dock building and its east/west truck drives.
- Street View on the east face: trailers from Target, UPS, Mesilla Valley, Roadrunner and Pinnacle Express in the shared yard confirm multi-tenant use. White Primo/ReadyRefresh delivery vans on the east side.

## Gate / guard-shack determination
- **truckGate: true** - chain-link perimeter fence encloses the east truck yard with vehicle-gate openings (Street View, east face). No barrier arm clearly visible; the Street View car drove freely into the central shared drive, so gate control appears light/open. Called true on a fenced-yard-with-gates basis (medium confidence).
- **guardShack: false** - no guard booth visible at any yard entrance in satellite or Street View.
- **remoteGs: true** - gated/fenced yard with no guard booth implies remote/self check-in (kiosk/app).

## Yard zones and counts
- **dockDoorCount ~60** - continuous dock banks run nearly the full ~300 m length on BOTH the east and west long faces (cross-dock). Many bays empty in the imagery; plausibly 50-80. This is the full audited building; the per-Primo share is a fraction since the building is multi-tenant. Banded 50+.
- **dropArea 25-50** - east drive carries marked stalls painted DROP TRAILERS / ONLY TRAILER with parked trailers; STAGING AREA cells also painted.
- **trailerParkingCapacity ~40** across the east drop strip plus the west drive shoulder.
- **shipRcvSeparate: true** - docks on two physically separate building faces (east and west).
- **entryExitSeparate: true** - separate east-side drive and west-side (shared) drive give independent in/out paths; lane counts ~1 each (low confidence).
- **fastLaneOpportunity: true** - very wide central shared drive and east drop apron give ample paved width for an express/bypass lane.
- **siteAreaAcres ~15.9** from the eastern-building parcel including its east and west truck drives.
- **railServed: false** - no rail spur enters the property.
- **urbanRural: Urban** - dense Gateway Park industrial fabric inside metro Denver; connectivity strong.

## Confidence
**Medium.** Site identity is firm (ReadyRefresh DC at 11700 E 47th Ave), but the building is a shared multi-tenant cross-dock, so dock-door and yard figures describe the whole building rather than the Primo share. Geometry traced as tight near-axis-aligned quads to the fence/wall/apron lines. Uncertain fields: dockDoorCount, trailerParkingCapacity, truckGate, remoteGs, entryLanes, exitLanes, shipRcvSeparate.
