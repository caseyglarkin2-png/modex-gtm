# Account Intelligence Feed — Contract (2026-06-15)
Systems not silos: every piece of modex account intelligence is callable by clawd.
All endpoints auth via `x-queue-secret: $QUEUE_AGENT_SECRET` (Bearer of the same
also accepted), fail-soft (never 5xx), and serve statically-imported committed
bundles (Vercel does not bundle runtime fs reads of output/**).

## Feeds
- `GET /api/intel/accounts/?domain=<d>|?slug=<s>&include=dossiers,geometry,microsite`
  One account's full intelligence: scores + yard-audit sites + 22-field
  classification + dossier markdown + geofence geometry + ABM research
  (painPoints/recentNews/yardFlowAngle/network) + committee. `detail_level` =
  `full` for the 56 audited accounts, `scored` for the rest, `none` if unknown.
  The `include` extras are opt-in (dossiers ~4.4MB, geometry ~0.9MB across all
  accounts; per-account payloads are small). Omit `include` for the lean record.
- `GET /api/intel/accounts/?cursor=<n>&limit=<=500` — the full deduped account
  list (5,921), ranked by composite, with domain + hubspot_company_id keys.
- `GET /api/intel/export/scored/?cursor=<n>&limit=<=500` — the full 7,912-site
  scored universe with every sub-score (verticalMatch/enterpriseScale/
  networkComplexity/primoProximity/corridorDensity), tier, nearestPrimo, corridor.
- Existing: `GET /api/intel/export/{replies,email_events,engagements,captures,outcomes,proximity}/`,
  the pounce spine, the Outbox queue.

## Freshness
Bundles are author-time generated + committed. `GET /api/cron/refresh-intel`
(weekly) pings #yardflow-intent when bundles exceed 14 days old; a human re-runs
the generators and commits.

## clawd relay
Everything modex knows is now callable, no silos. For a sniper job on account X:
`GET /api/intel/accounts/?domain=X&include=dossiers,geometry,microsite` returns the
yard/corridor intelligence you can't research off the web; pair it with your
research + synthesis + asset generation. Pull the full universe with
`/api/intel/export/scored/`. modex serves; clawd does canonical mapping + research.
