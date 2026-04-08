# Flagship Microsite Asset Index

Status: Active reference
Updated: 2026-04-07

## Purpose

This file is the fast lookup for the best current flagship microsite assets, their source-of-truth configs, and the named-person routes that are ready for review.

## Canonical Flagship Route

- Canonical public route: `/for/frito-lay`
- Canonical named-person route: `/for/frito-lay/bob-fanslow`
- Canonical proposal route: `/proposal/frito-lay`
- Locked scenario label: `230+ site high-velocity snack network`
- Release-gate coverage: [tests/e2e/public-shareability.spec.ts](../../tests/e2e/public-shareability.spec.ts)
- Release-gate rule: overview, named-person, and proposal routes must all render publicly with zero `/api/auth/session` requests and a successful route-specific OG image response.

## Frito-Lay

- Overview route: `/for/frito-lay`
- Proposal route: `/proposal/frito-lay`
- Named-person routes:
  - `/for/frito-lay/brian-watson`
  - `/for/frito-lay/beth-mars`
  - `/for/frito-lay/isaac-scott`
  - `/for/frito-lay/david-chambers`
  - `/for/frito-lay/bob-fanslow`
- Source of truth: [src/lib/microsites/accounts/frito-lay.ts](../../src/lib/microsites/accounts/frito-lay.ts)
- Facility evidence: [src/lib/data/facility-facts.json](../../src/lib/data/facility-facts.json)
- Supporting account context:
  - [docs/MODEX_FLOOR_PLAN.md](../MODEX_FLOOR_PLAN.md)
  - [docs/PHONE_LIST_TOP10.md](../PHONE_LIST_TOP10.md)
- Browser coverage: [tests/e2e/microsite-variants.spec.ts](../../tests/e2e/microsite-variants.spec.ts) covers the Bob Fanslow route
- Shareability coverage: [tests/e2e/public-shareability.spec.ts](../../tests/e2e/public-shareability.spec.ts) covers overview, Bob Fanslow, proposal, and OG image routes

## General Mills

- Overview route: `/for/general-mills`
- Proposal route: `/proposal/general-mills`
- Named-person routes:
  - `/for/general-mills/paul-gallagher`
  - `/for/general-mills/nisar-ahsanullah`
  - `/for/general-mills/ryan-underwood`
  - `/for/general-mills/zoe-bracey`
  - `/for/general-mills/lars-stolpestad`
- Source of truth: [src/lib/microsites/accounts/general-mills.ts](../../src/lib/microsites/accounts/general-mills.ts)
- Facility evidence: [src/lib/data/facility-facts.json](../../src/lib/data/facility-facts.json)
- Supporting account context:
  - [docs/research/paul-gallagher-generalmills-dossier.md](../research/paul-gallagher-generalmills-dossier.md)
  - [docs/research-dossiers-top10.md](../research-dossiers-top10.md)
  - [docs/MODEX_FLOOR_PLAN.md](../MODEX_FLOOR_PLAN.md)
  - [docs/PHONE_LIST_TOP10.md](../PHONE_LIST_TOP10.md)
- Browser coverage: [tests/e2e/microsite-variants.spec.ts](../../tests/e2e/microsite-variants.spec.ts) covers the Zoe Bracey route
- Shareability coverage: [tests/e2e/public-shareability.spec.ts](../../tests/e2e/public-shareability.spec.ts) covers overview, Zoe Bracey, proposal, and OG image routes

## AB InBev

- Overview route: `/for/ab-inbev`
- Named-person routes:
  - `/for/ab-inbev/elito-siqueira`
  - `/for/ab-inbev/ricardo-moreira`
- Source of truth: [src/lib/microsites/accounts/ab-inbev.ts](../../src/lib/microsites/accounts/ab-inbev.ts)
- Supporting account context:
  - [docs/research/elito-siqueira-abinbev-dossier.md](../research/elito-siqueira-abinbev-dossier.md)
  - [docs/research-dossiers-top10.md](../research-dossiers-top10.md)
  - [docs/MODEX_FLOOR_PLAN.md](../MODEX_FLOOR_PLAN.md)
  - [docs/PHONE_LIST_TOP10.md](../PHONE_LIST_TOP10.md)
- Browser coverage: [tests/e2e/microsite-variants.spec.ts](../../tests/e2e/microsite-variants.spec.ts) covers the Ricardo Moreira route

## Coca-Cola

- Overview route: `/for/coca-cola`
- Named-person routes:
  - `/for/coca-cola/daniel-coe`
  - `/for/coca-cola/dinesh-jadhav`
  - `/for/coca-cola/mark-eppert`
- Source of truth: [src/lib/microsites/accounts/coca-cola.ts](../../src/lib/microsites/accounts/coca-cola.ts)
- Supporting account context:
  - [docs/research-dossiers-top10.md](../research-dossiers-top10.md)
  - [docs/MODEX_FLOOR_PLAN.md](../MODEX_FLOOR_PLAN.md)
  - [docs/PHONE_LIST_TOP10.md](../PHONE_LIST_TOP10.md)
- Browser coverage: [tests/e2e/microsite-variants.spec.ts](../../tests/e2e/microsite-variants.spec.ts) covers the Mark Eppert route

## Dannon

- Overview route: `/for/dannon`
- Named-person routes:
  - `/for/dannon/heiko-gerling`
  - `/for/dannon/whitney-klemm`
  - `/for/dannon/jacqueline-beckman`
  - `/for/dannon/annette-tolve`
  - `/for/dannon/jay-luikart`
- Source of truth: [src/lib/microsites/accounts/dannon.ts](../../src/lib/microsites/accounts/dannon.ts)
- Supporting account context:
  - [docs/SHOWCASE_PROOF_SPRINT_REPORT.md](../SHOWCASE_PROOF_SPRINT_REPORT.md)
  - [docs/MODEX_FLOOR_PLAN.md](../MODEX_FLOOR_PLAN.md)
  - [docs/roadmaps/outreach-sprint-plan.md](./outreach-sprint-plan.md)
- Handling note: warm intro only via Mark Shaughnessy. No cold-booking path.
- Browser coverage: [tests/e2e/microsite-variants.spec.ts](../../tests/e2e/microsite-variants.spec.ts) covers the Heiko Gerling warm-intro route

## Notes

1. This index should only list routes backed by account config changes already committed or ready to commit.
2. Named-person routes belong here only when the copy is grounded in actual research, not a generic role hypothesis.
3. When a flagship account gains or loses a named-person route, update this file in the same commit.
