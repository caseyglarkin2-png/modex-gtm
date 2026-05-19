# Deep-Audit Dossier — Danone Portland OR (idx 12)

## Facility
- **Name:** Danone - Portland OR
- **Type:** Frozen yogurt / ice cream plant (legacy YoCream)
- **Address:** 5858 NE 87th Avenue, Portland, OR 97220
- **Resolved coordinates:** 45.56475, -122.57250 (building center)

## Step 0 — Location confirmation
The roster coordinate (45.564946, -122.572677, ROOFTOP) landed on the correct
building. Confirmed:
- Web research confirms 5858 NE 87th Ave is the Dannon YoCream International
  plant — 187,308 sq ft, ~60 employees, established 1977, produces frozen
  yogurt/ice cream/sorbet mix for the club channel (Costco, Sam's Club).
- The decisive visual confirmation: a May-2025 Street View of the building's
  west face on NE 87th Ave shows a wall-mounted "DANNON YoCream" sign.
The facility is a single connected industrial complex (a gray-roofed north
section and a white-roofed south section joined together) in NE Portland's
airport-area industrial district.

## Key views
- **z17/z18 overview:** Industrial district, freeway and rail line to the
  south. The YoCream building sits center-frame with trailers parked along its
  east and NE sides.
- **z19/z20 building tight:** Single connected complex. A rail track curves
  along the east/NE edge. Bulk storage silos line the east building face;
  reefer trailers parked along the SW dock face and east face.
- **Street View (May/Jul 2025):**
  - West face on NE 87th Ave: "DANNON YoCream" sign; site enclosed by tall iron
    perimeter fence.
  - NE 87th Ave entrance: a sliding iron gate with a call-box/intercom post
    beside it (a person was standing at the kiosk in the pano). No guard booth.
  - South face: refrigerated (Continental-logo) trailers backed into dock
    doors, accessed via a gated driveway off NE 87th Ave.

## Gate / guard-shack / dock determinations
- **truckGate = true.** A sliding iron gate controls the NE 87th Ave entrance;
  a separate gated driveway serves the south dock apron. The entire property
  is enclosed by a tall iron perimeter fence.
- **guardShack = false.** No staffed booth structure at either gate.
- **remoteGs = true.** The main NE 87th Ave gate has a call-box/intercom post
  and no guard shack — remote/kiosk-style driver check-in.
- **dockDoors = "10-25".** Reefer trailers backed into dock doors on the SW/
  south face (visible in 2025 Street View); additional dock positions along
  the east face by the bulk silos. ~12 doors estimated — honest overhead
  estimate, flagged low confidence.
- **dropArea = "0-10" / dropYard = true.** A paved trailer-staging yard north/
  NE of the building holds parked trailers separate from the active docks.

## Yard zones and counts
- **perimeter:** fenced parcel ~45.5641–45.5655 lat, ~-122.5734 to -122.5719
  lng — derived site area ~6 acres.
- **truckGate zone:** the NE 87th Ave sliding gate near 45.5646, -122.5730.
- **dropYards:** the paved staging yard north/NE of the building.
- **dockAprons:** two — the south reefer-dock apron and the east-face dock
  strip by the silos.
- **staging:** post-gate paved area between the entrance and the south docks.
- **Metrics:** ~12 dock doors, ~9 trailers visible, ~15 trailer capacity,
  2 truck gates, 1 building, ~6 acres.

## Web findings
- Dannon YoCream — established 1977; owned by Danone; Portland plant is the
  sole frozen-yogurt/ice-cream operation, supplying the club channel.
- 187,308 sq ft, ~60 employees per roster/Danone careers data.
- No driver review surfaced that contradicts the imagery.

## Rail note
A rail track curves along the east/NE edge of the property. It reads as a
through-siding running on/along the adjacent parcel rather than a spur entering
the YoCream building — no rail dock door is visible against the building.
`railServed` set false and flagged as uncertain.

## Final confidence
**High.** Facility positively identified (YoCream sign + address + research).
Gate, guard-shack and remote check-in determinations are well supported by
recent (2025) Street View. Dock-door count and rail-service status are honest
overhead estimates flagged as uncertain. Urban site, no campus, no truck scale,
no multi-step checkpoint.
