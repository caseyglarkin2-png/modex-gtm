# Deep-Audit Dossier — Samuel Adams Boston Brewery, Jamaica Plain MA

**Account:** The Boston Beer Company · **Roster idx:** 4
**Address:** 30 Germania Street, Boston, MA 02130 (Jamaica Plain)
**Locked center:** 42.3145, -71.1031
**Confidence:** High

## Location confirmation
The roster's ROOFTOP geocode (42.314544, -71.102795) landed on the brewery roof
(solar-paneled). Apple Maps lists 42.3144329, -71.1031187 — essentially the same
building, a few meters west. Satellite probing (z18-z20) and Street View
confirmed the historic Haffenreffer brewery complex: brick industrial buildings
with a cupola, a corrugated-metal warehouse section, and a solar-panel roof.
Web research and Boston Beer's own site confirm 30 Germania St as the original
Samuel Adams Boston Brewery — now the company's research-and-development
brewhouse with an attached visitor taproom. Street View interior imagery shows
fermentation tanks, kegs, and bourbon barrels — a working pilot brewery.

## Key views
- **Wide (z18):** Brewery complex embedded in dense Jamaica Plain residential
  fabric — triple-decker houses and small commercial buildings on all sides.
- **Tight (z19-z20):** Multi-building brick complex with solar panels; only
  small surface parking lots, no truck yard.
- **Street View (2019-2023):** Historic brick brewery buildings; the taproom
  side has outdoor seating, Samuel Adams banners, picnic tables, and a small
  parking lot with painted "PARKING" markings. A corrugated-metal warehouse wall
  fronts a residential street. No docks, gates, or guard structures anywhere.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE.** A small heritage R&D brewery and taproom; access is via
  narrow public residential streets with only small surface parking. No barrier
  arm, sliding gate, or checkpoint.
- **Guard shack: FALSE.** No guard booth — the only structures are the brewery
  buildings and a visitor taproom entrance.
- **remoteGs: FALSE** — no gate.
- **backupSensitive: TRUE.** Extremely tight urban site; any delivery vehicle
  maneuvers on narrow public streets and would block traffic. Realistically only
  box trucks/vans serve this site.
- **Docks:** ~2 service/loading doors at most. This is an R&D brewhouse and
  taproom, not a distribution facility. dockDoors band 0-10.
- **dropArea: NONE / dropYard FALSE** — no trailer parking on site.
- **shipRcvSeparate: FALSE** — no separate dock clusters; minimal loading.

## Yard zones & counts
- **Perimeter:** ~2.4 acres — a small urban heritage parcel ("smaller footprint"
  per the roster).
- **Drop yards / dock aprons / staging:** none — left empty/null.
- **Trailers visible:** 0; capacity 0.
- **Buildings:** ~3 connected historic structures comprising the brewery+taproom
  occupancy (multipleFacilities FALSE — one contiguous facility).
- **Rail-served:** FALSE.
- **Scale:** none.

## Web findings
Boston Beer's site and meetBoston confirm this is the original Samuel Adams
Brewery, now the R&D brewhouse and the cornerstone heritage/tour site, with a
public taproom and an on-site visitor parking lot. No distribution or
large-truck operations are documented — consistent with the observed lack of
docks and trailer yard.

## Final confidence
**High.** Building positively identified; the site is unambiguously a small
urban heritage/R&D brewery with no truck gate, no guard shack, and no trailer
yard. Only the exact loading-door count is an estimate (flagged).
