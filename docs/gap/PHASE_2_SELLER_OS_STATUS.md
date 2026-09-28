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

## Debt recorded (not fixed in this program unless it blocks)

(none yet)
