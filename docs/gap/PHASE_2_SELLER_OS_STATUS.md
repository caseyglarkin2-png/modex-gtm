# GAP OS Phase 2: Seller OS (status ledger)

STATUS: ACTIVE

<!-- verified:2026-09-28 -->

Objective: maximize verified buyer truth per minute of Casey's time. Machines
find, fetch, verify, remember, route, stop and organize. Casey decides what we
believe, who hears it, what the buyer said, and what we learn next.

Baseline: `origin/main` 3fde96a9 (last-mile hardening, PR #277). The safety
architecture (evidence gate, human approval, human BID confirmation, send
gates, suppression, opportunity protection, stale-card protection,
HUMAN_APPROVED_1TO1, auto-send OFF, auto-enroll OFF) is authoritative and is
not reopened here.

One implementation owner per release; read-only reviewers only. One PR per
release, merged and production-verified before the next starts.

## Release ledger

| Release | Scope | Branch | PR | Merge | Production |
|---|---|---|---|---|---|
| A | Truth infrastructure + health | feat/gap-phase2-a-truth-health | | | |
| B | Verified evidence inbox | | | | |
| C | Account motion v0 | | | | |
| D | Mobile buyer truth capture v0 | | | | |
| E | Seller action pack v2 | | | | |
| F | In Deals + Deal Brief v0 | | | | |
| G | Integrated seller-OS acceptance | | | | |

## Release A: truth infrastructure + health

### A1. Hand-added public facts use the one verification contract
- `research/run.ts` now exposes the contract research always used:
  `verifyCandidate` (dated, physical-network change, excerpt verbatim at its own
  URL, non-EDGAR page names the account) and `storeVerifiedFact` (EvidenceRecord
  + evidence_record signal with `metadata.verified = excerpt_found_at_source`).
  Research itself calls the same two functions (behavior unchanged).
- `research/manual-fact.ts verifyPublicFact`: a public URL + sentence + date
  typed by Casey runs `verifyCandidate`. Pass: stored by `storeVerifiedFact`
  (may satisfy the evidence gate). Fail: the old `manual` context signal (the
  gate always refuses it) plus the reason. Every attempt writes a ResearchRun
  (`purpose gap_manual_fact`) and a `research.manual_fact` audit row.
- `POST /api/gap/signals` public: account checked first, then verification. A
  missing date is NOT today (only an explicit publication date can be verified).
  Response `{id, created, verified, reason}`. The body cannot carry metadata or a
  source kind (zod strips unknown keys), so no route can mint the stamp.
- Add Fact form: no "Quotable" promise; "Exact sentence" + "Published on" (never
  defaulted); the notice says verified or exactly why not.
- Operator knowledge is unchanged: first-party, never quotable.

### A2. Send-time attribution + read-only deal observation
- `execution/send-attribution.ts captureSendAttribution`: stamped INTO every
  Gmail-proven send ledger row (DIRECT_SENT, DRAFTED, DRAFT_SENT, MANUAL_SENT,
  unknown-send reconcile): primary outreach fact id, signal type / source kind /
  source type, opener approach (`verified_fact_observation` for step 0,
  `follow_up:<purpose>` after), persona title / seniority / role in deal /
  persona key, account name / tier / HubSpot company / canonical company (only
  a `resolved` link), problem family. Version and evidence tier were already
  on the rows. Never throws, never blocks a send; failures and all older rows
  read `unrecorded` (`sendAttributionOf`). No backfill. Learning UI unchanged.
- `learning/deal-observation.ts`: read only. First Gmail-proven GAP send per
  account, then HubSpot deals (createdate) on the SAME company identity the
  opportunity resolver uses (`resolveCompanyIdentity`, extracted, behavior
  unchanged). 60 / 120 day windows reported open until elapsed; unreadable is
  `unknown`, never "no deal"; deals created before the first touch are context.
  Script: `scripts/gap/deal-observation.ts`. No HubSpot writes, no causality.

### A3. Health strip
- `health/health.ts evaluateHealth` (pure) over five dependencies: mailbox
  intake (cron `gap-mailbox` state), HubSpot reads (bounded ping), suppression
  authority (bounded contract read of a reserved probe address), GAP sender
  config, last completed routing run. Overall = worst; never green because
  another dependency works. `GET /api/gap/health` (session, no-store) and
  `<HealthStrip>` at the top of /gap, loaded after the page, details under a
  disclosure, "could not be checked" when it cannot load.
- Thresholds: mailbox healthy <=30m, degraded <=3h, blocked after; HubSpot
  degraded >5s, blocked on error; routing degraded >24h (click-time gates keep
  stale cards safe, so old routing is never "blocked").

### A4. Identity status audit
- Opportunity identity deliberately reads EVERY canonical link status
  (PepsiCo and Dannon are `conflict` in production): a conflicting domain can
  only add companies to the open-deal check. Identity resolution and send
  attribution use only `resolved`. Kept the union, documented it in
  `loadOpportunityIdentity`, pinned it (tests/unit/gap/identity-status.test.ts).
  No identity layer.

### Release A validation
- Mutations proven RED then restored: unverified manual fact stored as
  verified; verifier skips the verbatim check; attribution dropped from a
  direct send; health overall ignores a blocked dependency; opportunity
  identity filtered to resolved links.

## Debt recorded (not fixed in this program unless it blocks)

(none yet)
