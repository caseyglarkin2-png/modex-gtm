# US PL McBee Factory - Deep-Audit Dossier

**Idx 17 | Scope: BT-active | Type: Bottling plant (PL)**
**Resolved center: 34.46378, -80.23403** | [Maps](https://www.google.com/maps/@34.46378,-80.23403,400m/data=!3m1!1e3)

## Location resolution
Confirmed the Primo Brands / former Nestle Waters (BlueTriton) Deer Park bottling plant at 100 Nestle Way, McBee SC. The supplied reference coords (34.4700, -80.2586) landed on the town of McBee ~1.6 km NW; the web-verified plant address geocode (N34 27 44, W80 14 16 = 34.46226, -80.23788) put the audit on the cleared industrial parcel SE of town off US-1/US-601. Locked the building center at 34.46378, -80.23403 from zoom 17-20 satellite.

## Key views
- Satellite z16-20 of the ~200,000 sq ft plant and its west-side trailer drop yard.
- Highway Street View (2023-07, pano vXBOiv3pfZXVJd-IITpynw) of the US-1/601 entrance. No interior Street View coverage (private rural site); all zone SV metadata except the highway entrance returned ZERO_RESULTS.

## Gate / guard-shack determination
- **truckGate: true** (medium) - single controlled entrance drive off the US-1/601 divided highway with a dedicated turn lane and a long private drive into the property. No barrier arm resolvable in imagery but it is a clear single pinch-point truck entrance.
- **guardShack: false** - no staffed booth visible at the highway entrance (Street View 2023-07 shows only an open turn-lane entry and a monument sign) and none resolvable at the yard entry.
- **remoteGs: true** - controlled single-point truck entrance off a divided highway with no guard shack, implying kiosk / call-box / app check-in.

## Yard zones and counts
- **dockDoorCount ~28** - west building face has a long bank of dock positions sheltered under projecting canopies/awnings with diagonal-striped approach lanes; canopies obscure the exact count. Banded 25-50, low precision.
- **dropArea 50+** - dedicated trailer drop yard on the west/northwest side holds many parked drop trailers in long rows (~70-80 counted in imagery).
- **dropYard: true** - distinct paved trailer-storage lot west of the building, separate from the active dock apron.
- **trailerParkingCapacity ~110** stalls across the drop-yard rows; ~75 trailers visibly parked.
- **postGateStaging: true** - large paved yard between the entry drive and the dock face provides ample internal queuing.
- **drivewayLong: true** - entry drive from the highway runs several hundred meters in and the internal yard is deep; easily holds 3+ trucks.
- **fastLaneOpportunity: true** - very wide paved central drive lane through the trailer yard plus a single open entry give room for an express/bypass lane.
- **buildingCount 2** - main ~200,000 sq ft bottling plant plus one separate long building to the NW (likely office/maintenance/secondary warehouse). Not a multi-large-cluster campus, so multipleFacilities=false.
- **siteAreaAcres ~78** from the perimeter polygon of the cleared/graded parcel; the fenced operating footprint is smaller.
- **railServed: false** - no rail spur runs into the property.
- **urbanRural: Rural** - open farmland southeast of a very small town (McBee, pop ~700); cellular coverage likely marginal, so connectivityIssue flagged true (medium confidence, inferred).
- **scale: false** - no truck scale / weigh pad resolvable in the truck path.

## Confidence
**Medium.** Plant identity firm; dock-door count is the main soft figure (canopies hide the bays). Uncertain fields: dockDoorCount, guardShack, remoteGs, truckGate, postGateStaging, connectivityIssue, entryLanes, exitLanes, buildingCount.
