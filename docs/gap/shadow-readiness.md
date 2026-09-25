# GAP OS dogfood, Phase 6: shadow readiness

STATUS: `GAP_AUTO_ENROLL_SHADOW` left OFF. Gate not met tonight.

<!-- verified:2026-09-24 -->

## The gate that blocks tonight

Per the overnight directive: shadow may only be enabled "if at least one
legitimate recommendation-vs-human-action comparison exists." That requires
a real GAP routing recommendation AND a real, unambiguous human action taken
in response to it -- not manufactured, not inferred from absence.

Checked both candidate sources tonight:

1. **The 20 Phase 4 draft hypotheses.** These exist and are routable, but
   Casey has not reviewed any of them yet (they were created tonight). No
   human action exists to compare against a recommendation. Waiting on
   Casey is correct here, not a gap in this session's work.
2. **The Inland26 reconciled evidence (Phase 3).** All six evidence rows
   classified IDENTITY_UNRESOLVED or HYPOTHESIS_MISSING -- neither is a
   MATCHED outcome, and neither has a GAP routing recommendation behind it
   (the sends happened entirely outside the GAP pipeline, per the dry-run
   doc). There is nothing here to compare a recommendation against; the
   human action (sending the email) predates GAP even having an opinion.

**Conclusion: the gate is not met. Zero legitimate comparisons exist yet.**
This is not a missing capability -- `RoutingDecision`, `human_action`, and
the agreement-comparison plumbing already exist (Sprint 6, `routing-agreement*`
tests pass). It is missing DATA: nobody has looked at a GAP recommendation
and acted on it yet, because the recommendations are new tonight.

## What is needed before shadow can turn on

1. Casey opens `/gap/hypotheses/` and reviews at least one of the 20 Phase
   4 drafts (CONTACT/ENROLL, HOLD, RESEARCH, REJECT HYPOTHESIS, WRONG
   PERSON, LIVE OPPORTUNITY, or OTHER).
2. That decision needs to reach a `RoutingDecision.human_action` (or
   equivalent) record so the comparison plumbing has one real row to work
   with -- whatever UI action Casey takes should already write this; no new
   code identified as missing here.
3. Once at least one such comparison exists, re-run this evaluation. If it
   passes, `GAP_AUTO_ENROLL_SHADOW=true` (ONLY -- `GAP_AUTO_ENROLL_ENABLED`,
   `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED`, `GAP_HUBSPOT_MIRROR_ENABLED` stay
   false) can be set via Vercel env + redeploy.

## Exact cohort shadow would use, once unblocked

The same 8-account, 20-hypothesis Phase 4 cohort (`docs/gap/dogfood-hypothesis-cohort.md`)
plus whatever new hypotheses exist by then -- bounded to the resolved-identity
population, never the full 1,707-account database.

## Exact expected shadow command/run

```
# after setting GAP_AUTO_ENROLL_SHADOW=true in Vercel prod env and redeploying:
curl -s -H "x-cron-secret: $CRON_SECRET" \
  "https://modex-gtm.vercel.app/api/cron/gap-routing?mode=apply&maxAccounts=20"
```
(exact route/params per `src/app/api/cron/gap-routing/route.ts` -- confirm
query param names against that file before running; not re-verified in this
pass since the gate above blocks running it at all tonight.)

## Exact verification queries

```sql
-- every routing decision this run created must show mode='shadow' and null acted_by_system_at
select mode, acted_by_system_at, count(*) from routing_decisions
  where run_id = '<the run id>' group by 1, 2;

-- must be zero
select count(*) from sequence_enrollments where enrolled_by = 'gap-shadow' ;
```

## Exact rollback command

```
# Vercel env:
vercel env rm GAP_AUTO_ENROLL_SHADOW production
vercel env add GAP_AUTO_ENROLL_SHADOW production   # value: false
vercel --prod deploy   # or trigger redeploy via the dashboard/API
```

## Safety state right now

`GAP_AUTO_ENROLL_SHADOW=false` (untouched). `GAP_AUTO_ENROLL_ENABLED=false`,
`GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED=false`, `GAP_HUBSPOT_MIRROR_ENABLED=false`
(all untouched). `OUTREACH_PAUSED` untouched. Clawd autonomy halt untouched.
No flag was flipped or redeployed tonight.
