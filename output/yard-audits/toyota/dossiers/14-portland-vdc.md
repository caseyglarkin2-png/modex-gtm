# Deep Audit — Toyota Logistics Services VDC, Portland OR (idx 14)

**Facility:** Toyota Logistics Services Vehicle Distribution Center — Port of Portland, Terminal 4
**Type:** Vehicle Distribution Center (port vehicle processing)
**Resolved coordinates:** 45.6365, -122.7540
**Address:** 11020 N Lombard St, Portland, OR 97203 (Terminal 4, Port of Portland)
**Confidence:** Medium

## Location resolution

Roster supplied a Terminal 4 point (45.6373, -122.7550). Web research resolved the
precise TLS lease to **11020 N Lombard St** — the ~101,000 sf VDC building Toyota
Logistics Services operates at Port of Portland Terminal 4 (confirmed via Yelp,
D&B, BBB, and Port of Portland Terminal 4 pages). Toyota has operated here since
1971, handling more than 10,000 vehicles per month. Satellite at z15-z21 confirms
a large white-roofed processing building, striped vehicle-marshalling lots, rail
running into the yard, and a fenced perimeter — matching the described VDC.

## What the imagery showed

- **z15/z16 overview:** Terminal 4 waterfront parcel with a large white-roofed VDC
  building, extensive striped vehicle lots to the N and E along the Willamette
  River, and rail spurs threading the yard. Container/other terminal operations
  occupy other parts of Terminal 4.
- **z18 building close-up:** Large rectangular processing building; the NE/N side
  has a paved yard with ancillary structures and rail tracks along the north edge.
- **z19 NE close-up:** Internal layout — a small standalone building (white roof)
  at the NW of the operational yard (gatehouse/office), chain-link fencing
  dividing the marshalling lots from the processing/parking areas, internal
  checkpoint area.
- **z20/z21 entrance & rail:** The access road off N Lombard St is a wide
  multi-lane apron with stop markings; auto-rack rail tracks and rail-side
  structures run through the yard; a continuous internal chain-link fence
  separates the controlled truck/vehicle yard from outer parking.
- **Street View (N Lombard St, 2023-05):** Building set back from the road; rail
  crossing with crossing gates at the facility access road; Toyota signage at the
  entrance. Street View coverage on the frontage is limited (panos cluster at the
  SW intersection).

## Gate / guard-shack determination

- **truckGate = true.** The facility sits inside the Port of Portland Terminal 4
  secure area with a fenced perimeter and internal security fencing. The N Lombard
  access road feeds a controlled multi-lane apron into the operational yard. As a
  maritime port facility, controlled gated entry is certain.
- **guardShack = true (inferred, medium confidence).** A small standalone building
  with a compact footprint sits at the NW corner of the operational yard beside
  the internal entrance — consistent with a gatehouse. Port facilities are staffed
  for credential checks. A discrete booth right at the road edge could not be
  unambiguously confirmed; flagged uncertain.
- **remoteGs = false** — guard shack inferred present.
- **multiStep = false** — no clearly distinct second checkpoint visible (rail
  crossing gate at the access road is a rail safety device, not a truck checkpoint).

## Yard zones & counts

- **Perimeter:** ~48 acres covering the TLS VDC building and vehicle lots within
  Terminal 4.
- **Drop / marshalling yards:** large striped vehicle lots N and E of the building.
- **Dock apron / staging:** processing-building face with a deep apron
  (`drivewayLong` true).
- **Dock doors:** ~8, banded 0-10 (vehicle-processing building, not a cross-dock).
- **Rail served:** YES — auto-rack rail into the yard, rail cars on-site.

## Web findings

- TLS-operated VDC at Terminal 4; Toyota presence since 1971; >10,000 vehicles/mo.
- ~101,000 sf VDC building.
- Terminal 4 operations support 750+ jobs and $232M+ in related earnings.

## Final confidence: MEDIUM

Location and facility identity are certain. Gate presence is certain (Terminal 4
secure fenced perimeter). Guard-shack, dock-door count, lane counts, scale and
trailer-parking capacity are inferred from facility type and partial imagery
(limited Street View frontage coverage) — flagged in uncertainFields. As a
vehicle-processing port facility, conventional dock/trailer metrics are an
imperfect fit and should be read as honest estimates.
