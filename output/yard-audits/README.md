# output/yard-audits — what the directories are

STATUS: ACTIVE
Last verified: 2026-08-12

63 directories. They are not all the same kind of thing, and the difference has
already cost real confusion — four of them read as orphan debris until traced.

## 59 account directories — keyed by AUDIT slug

Have `sites/*.json`. These are the raw research corpus: 1,178 facility records.
Every generator enumerates these and skips anything without a `sites/` folder.

```
<audit-slug>/
  roster.json                      the discovered facility list
  roster.raw.json                  pre-geocode
  sites/NN-*.json                  ONE RECORD PER FACILITY — the source of truth
  dossiers/NN-*.md                 prose research per facility
  <slug>.geojson                   GENERATED  build-geojson.ts
  <slug>-geofence-links.md         GENERATED  build-geofence-links.ts
  <slug>-sales-summary.md          GENERATED  build-sales-summary.ts
  <slug>-location-breakdown.csv    GENERATED  generate-csv.ts
  verification-rejections.md       HAND-WRITTEN evidence (see the warning below)
  fov-report.md                    GENERATED  build-demo-pack.ts, gitignored
```

## 4 evidence-archive directories — keyed by PACK slug

`campbell-s`, `kenco-logistics-services`, `mondelez-international`,
`universal-logistics-holdings`.

Each contains exactly one file: `verification-rejections.md`. **These are not
orphans and not incomplete work.** They are the completed FOV verification
research from the 2026-06-19 scrub, filed under the MICROSITE slug because that
scrub ran pack-direct — it read `public/demo-packs/<pack-slug>.json` and stamped
verdicts onto the pack's site objects rather than back onto the source records.

`scripts/yard-audit/slug-map.ts` holds the mapping:

| Audit slug (has `sites/`) | Pack slug (evidence archive) | Scrub result | Pack today |
|---|---|---|---|
| campbells (21) | campbell-s | 20 confirmed, 1 rejected | 20 sites, 20/20 verified |
| kenco-logistics (30) | kenco-logistics-services | 22 confirmed, 2 probable, 6 rejected | 24 sites, 24/24 verified |
| mondelez (22) | mondelez-international | 15 confirmed, 2 probable, 5 rejected | 17 sites, 17/17 verified |
| universal-logistics (26) | universal-logistics-holdings | 16 confirmed, 2 probable, 8 rejected | 18 sites, 18/18 verified |

Every row reconciles: sites minus rejected equals the pack's site count, and
every shipped site carries verification. **These four accounts are correctly
evidence-gated.** The source records are the stale side, not the packs.

This matters for reading corpus numbers honestly. 218 source records have no
`verification` block, but 99 of them belong to these four accounts and their
evidence exists downstream in the pack. Counting them as "unverified research"
is true of the source file and false of the account.

## Why the source records were never backfilled

Nothing writes verdicts back up the pipeline. The scrub went
pack -> pack, so `output/yard-audits/campbells/sites/*.json` still has no
`verification` key. Anything reading the SOURCE for those four accounts sees
zero evidence; anything reading the PACK sees complete evidence. Backfilling the
source from the packs is the clean fix and is recorded as an owner action in
`EVIDENCE-BOUNDARY.md`.

## Warning: verification-rejections.md is contested ground

Two different things have used that filename:

- **hand-written cited research** — why a site was rejected, with Tier-1/Tier-2
  sources. 53 files, 2,719 lines.
- **a generated FOV stub** — five lines, written by `fovGate()` on every pack
  build, which used to OVERWRITE the research.

That collision already destroyed evidence on `ball`, `crowley` and `kroger`
(recoverable at `19e7c6aa` for crowley and `313132cd` for kroger), and
`modex-gtm-demo-aplus` is sitting on 51 more files of the same damage,
uncommitted. `fovGate()` now writes `fov-report.md` instead, and that name is
gitignored. Two stub headings exist — `# FOV warn report` and
`# FOV enforce report` — so any recovery sweep must match both.

## The invariant a test now holds

`tests/unit/yard-audit-corpus.test.ts` asserts every directory here is either an
account with `sites/` or one of the four named evidence archives. A new
directory that is neither fails the build, so nothing can sit in this tree again
without the pipeline knowing what it is.
