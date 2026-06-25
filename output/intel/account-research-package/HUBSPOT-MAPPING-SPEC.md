# Account Research → HubSpot Mapping Spec
For clawd: how to map ALL our account-based research onto HubSpot, with the right
records and the right fields. Source of truth for the canonical entity model.

## The model: one Company, many Facilities, the Committee
- **Company** = the account. ONE record per real company, keyed by **domain**.
  Tractor Supply is one company, not 50. modex already created the 14 score
  properties on this object (below). clawd owns canonical resolution + the single
  company write (its domain/alias resolver + HubSpot sync).
- **Facility (custom object, recommended)** = one record per physical site,
  associated to its Company. This is where the per-site yard intelligence lives
  (geofence, metrics, 22-field classification, dossier). If a custom object is
  too heavy for v1, attach each site as a Note/dossier on the Company instead.
- **Contact** = a buying-committee member, associated to the Company.

Identity rule: resolve every site to its Company by domain (then alias, then
name). Sites roll up to the Company; the Company score is the best/aggregate
across its sites. Never create a Company per site.

## COMPANY fields (the account record)
Already created by modex (`scripts/intel/ensure-score-properties.mjs`), populate from the package `scores` + `yard_aggregate`:
| HubSpot property | source (account-research.json) |
|---|---|
| `yardflow_composite_score` | scores.composite (0-100, the full discovery score) |
| `yardflow_proximity_score` | scores.proximity |
| `yardflow_fit_score` | scores.fit |
| `yardflow_corridor_density` | scores.corridor_density |
| `yardflow_nearest_primo_mi` | scores.nearest_distance_mi |
| `yardflow_nearest_primo_site` | (nearest live Primo site name) |
| `yardflow_yard_facilities` | yard_aggregate.facilities |
| `yardflow_yard_gated_pct` | yard_aggregate.truck_gated_pct |
| `yardflow_yard_dock_doors` | yard_aggregate.dock_doors |
| `yardflow_yard_trailer_cap` | yard_aggregate.trailer_cap |
| `yardflow_yard_archetype` | yard_aggregate.top_archetype |
| `yardflow_yard_entry` | yard_aggregate.recommended_entry |
| `yardflow_dossier_url` | dossier_url (the /for page) |
| `yardflow_score_at` | package generatedAt |

Already present on Company (do not recreate): `yardflow_tam`, `tam_tier`,
`tam_segment`, `tam_reason`, `na_operating`; `intent_score`/`last_intent_*`;
`trigger_score`/`last_trigger_*`; `yardflow_icp_score`. Standard: `name`,
`domain`, `industry`, `city`, `state`.

## FACILITY fields (the per-site record — propose a custom object `facility`)
Populate one per element of `account-research.json.accounts[].sites[]`:
| Facility property | source (sites[]) |
|---|---|
| `name` | name |
| `facility_type` | type |
| `latitude` / `longitude` | lat / lng |
| `dock_doors` | yard_metrics.dockDoorCount |
| `trailers_visible` | yard_metrics.trailersVisible |
| `trailer_capacity` | yard_metrics.trailerParkingCapacity |
| `truck_gates` | yard_metrics.truckGateCount |
| `building_count` | yard_metrics.buildingCount |
| `site_acres` | yard_metrics.siteAreaAcres |
| `rail_served` | yard_metrics.railServed |
| `truck_gate` / `guard_shack` / `remote_gs` / `pre_gate_staging` / `post_gate_staging` / `backup_sensitive` / `entry_exit_separate` / `fast_lane_opportunity` / `ship_rcv_separate` / `drop_yard` / `scale` / `multi_step` / `multiple_facilities` | classification.* (the 22-field rubric — booleans + bands) |
| `dock_door_band` / `drop_area_band` / `urban_rural` / `entry_lanes` / `exit_lanes` | classification.dockDoors / dropArea / urbanRural / entryLanes / exitLanes |
| `audit_confidence` | confidence |
| `maps_url` | maps_url |
| `dossier_path` | corpus.dossier_dir + the site's dossier .md |
| `geofence_source` | raw_site_json (full geofence rings live here) |
Associate each Facility → its Company (domain resolve).

## CONTACT fields (the buying committee)
Populate from `account-research.json.accounts[].contacts[]`, associate → Company:
| HubSpot contact | source (contacts[]) |
|---|---|
| `firstname`/`lastname` | name |
| `jobtitle` | title |
| `email` | email |
| `phone` | phone |
| `hs_linkedin_url` | linkedin_url |
| `yardflow_persona_function` | function |
| `yardflow_persona_seniority` | seniority |
| `yardflow_role_in_deal` | role_in_deal |
| `yardflow_persona_status` | status |
(create the `yardflow_persona_*` contact properties if you want them; else fold into notes.)

## Procedure for clawd
1. Read `account-research.json` (56 audited accounts, the rich join) + the broader
   `scored-prospects-2026-06-04.json` (7,912 sites, all sub-scores) for the full
   universe.
2. Resolve each account/site to its canonical Company by domain (your resolver).
3. Upsert the Company (score + aggregate fields), upsert its Facilities
   (associate), upsert its Contacts (associate).
4. Use the dossiers (`corpus.dossier_dir`, 1,038 .md) as the narrative layer —
   attach or summarize per Facility/Company.
See DATA-PACKAGE-MANIFEST.md for every source path + access method.
