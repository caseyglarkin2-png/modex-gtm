# The Home Depot - Facility Operation Verification (FOV) rejections & flags

Run date: 2026-06-18. Verified by agent (real web research).
Sites verified: 30 of 30.

## Result summary
- Confirmed: 29
- Probable (ships caveated/capped): 1
- Rejected: 0

No site was rejected. The Home Depot is a healthy, growing US retailer that has
been BUILDING out its supply chain (it has not divested or closed DCs in this
set), so `checkedBankruptcyEra` is false for every site and the divestiture/
closure gauntlet (`closed OR relocated OR sold OR WARN`) surfaced no negative
tied to any of these 30 facilities. The only HD-adjacent closures found in
2025-2026 were a Mexico, Missouri DC and an HD Supply site in La Vergne, TN -
neither is in this corpus. Every non-rejected site carries >=1 real citation
(cross-referenced against the SPS Commerce / SupplierWiki Home Depot DC list by
DC number + type + address, plus, where available, Home Depot's own newsroom/IR,
live careers.homedepot.com postings, econ-dev press, or landlord/CRE listings).

## PROBABLE (1) - location landmine, ships capped

- **Home Depot FDC - Dallas TX** (01-dallas-fdc.json) - PROBABLE, not confirmed.
  Home Depot UNAMBIGUOUSLY operates its flagship flatbed distribution center
  (FDC, the first one it ever built) in Dallas. The operating entity is not in
  doubt. The landmine is LOCATION: the prior audit could not positively resolve
  the building - the roster geocode (9222 W Jefferson Blvd area) landed on what
  looked like a small empty dirt lot, and public sources conflicted between
  9222/9302 W Jefferson Blvd (75211) and 3730/4721 Mountain Creek Parkway
  (75236). The SPS/SupplierWiki DC list and HD's FDC-launch press both place
  FDC 5824 at 9222 W Jefferson Blvd, Dallas 75211, and the saved coords
  (32.7415, -96.9755) fall in that W Jefferson corridor - but the exact building
  was not pin-confirmed. Verdict probable + flagged: re-resolve the geofence to
  the 9222 W Jefferson Blvd parcel (not Mountain Creek Pkwy/75236) before
  shipping. [Tier 1: https://corporate.homedepot.com/news/company/supply-chain-unveils-first-flatbed-distribution-center-fdc, 2020-01-28]

## Non-blocking notes / flags carried in the site JSONs (all CONFIRMED)

These do not block the site but should be respected at the geofence/classify step:

- **07-redlands-ca-rdc.json** - Confirmed (RDC 5087, 27352 River Bluff Ave).
  Saved coords sit nearer downtown Redlands than the River Bluff DC; verify the
  geofence is drawn on the River Bluff Ave building.
- **08-houston-tx-rdc.json** - Confirmed. Coords land in the NW-Houston 77064
  cluster that holds TWO HD RDCs (5521 at 11333 N Gessner Rd, 5520 at 8103
  Fallbrook). Confirm which building the geofence bounds.
- **14-tracy-ca.json** - Confirmed (RDC 5641, 1400 Pescadero Ave). A separate HD
  DC 5857 also exists in Tracy on Hopkins Rd; keep them distinct.
- **21-winchester-va-sdc.json** vs **10-winchester-va-rdc.json** - Two DISTINCT
  Winchester facilities, both confirmed: the SDC complex (DC 5362/64/65/66) is
  at 280 Maranto Manor Dr (22602); the RDC (5030) is at 480 Park Center Dr
  (22603). The SDC coords correctly map to Maranto Manor.
- **23-jersey-village-tx-sdc.json** - Confirmed but **3PL-operated** (operator
  set to "3PL"): HD SDC 5501 at 7301 Security Way is run by Temco Logistics
  within HD's network (per the June-2026 HD careers posting). Still HD's site;
  included and tagged.
- **24-lathrop-ca-sdc.json** - Confirmed, leased. HD has been sole tenant since
  2007; the building was SOLD to an investor in 2025 (CenterPoint -> buyer,
  $85M) but HD remains the operating tenant. Owner != operator; this is a lease,
  not a divestiture - correctly included.
