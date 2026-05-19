# Deep-Audit Dossier — Coca-Cola Atlanta Beverage Base Plant (idx 2)

## Facility
- **Name:** Coca-Cola Atlanta Beverage Base Plant
- **Type:** Concentrate / Beverage Base Plant
- **Address:** 1001 Great Southwest Pkwy SW, Atlanta, GA 30336
- **Locked coordinates:** 33.73430, -84.56900

## Step 0 — Location confirmation
The roster geocode (33.73407, -84.568761) moved 1341 m and landed directly on a
large process/manufacturing building cluster along Great Southwest Pkwy SW.
Satellite probes at z18/z19 show a sprawling concentrate-plant building with
process tanks, multiple roof units, an ornamental-fenced visitor parking area
with a red Coca-Cola sign visible in Street View, and a chain-link perimeter
fence. The A2LA lab directory lists "The Coca-Cola Company - Atlanta Beverage
Base Plant" at this address; the building footprint and process equipment are
fully consistent with a beverage-base / concentrate plant. Confirmed.

## Key views
- **z18 overview:** Large irregular process building; process tanks on the
  northwest; diagonal trailer-parking stalls on the west side; office and
  employee parking to the south.
- **z21 entrance:** The southwest access drive narrows to a small dark-roofed
  booth structure with the drive splitting into lanes around it — a guarded
  checkpoint.
- **Street View (2025-02):** Ornamental fence with brick pillars around the
  parking area; chain-link perimeter fence; red Coca-Cola sign at the entrance
  road. Trees obscured a direct view of the gate booth.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Single controlled entrance off the southwest connector
  road; z21 satellite shows a barrier across the lane and a booth.
- **guardShack = true (medium confidence).** A small booth sits in the entrance
  drive with lanes splitting around it — classic guard-booth geometry — but
  Street View was tree-obscured, so flagged as uncertain.
- **remoteGs = false** — a booth structure is present.
- **dockDoors = 10-25.** Modest dock bank (~16 doors) on the west building face;
  this is a process plant, not a high-throughput DC.

## Yard zones and counts
- **Perimeter:** ~24 acres bounded by Great Southwest Pkwy on the southeast and
  a rail/tree corridor on the north.
- **Drop yard:** Diagonal trailer stalls on the northwest side, ~15-20 trailers
  visible, capacity ~30.
- **Dock apron:** West building face.
- **truckGateCount:** 1.
- **buildingCount:** 2 (main process plant + ancillary structures/tank house).
- **railServed = false** — the rail line runs in a corridor serving the
  adjacent warehouse, not this property.

## Web findings
A2LA lists the Atlanta Beverage Base Plant (ISO/IEC 17025:2017 accredited).
Innovative Engineering documents a 4,200 SF two-story lab/office addition, new
cafeteria and compressor facilities. It is an active TCCC company-owned
concentrate facility.

## Final confidence
**Medium.** Location positively confirmed by address, signage and building
type. Gate is clear; the guard booth is strongly indicated by satellite but not
directly confirmed in Street View (trees), so `guardShack` and dock/lane counts
are flagged as uncertain.
