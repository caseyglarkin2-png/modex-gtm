# Flagship Microsite Asset Index

Status: Active reference
Updated: 2026-04-07

## Purpose

This file is the fast lookup for the best current flagship microsite assets, their source-of-truth configs, and the named-person routes that are ready for review.

## Frito-Lay

- Overview route: `/for/frito-lay`
- Named-person routes:
  - `/for/frito-lay/brian-watson`
  - `/for/frito-lay/beth-mars`
  - `/for/frito-lay/isaac-scott`
  - `/for/frito-lay/david-chambers`
  - `/for/frito-lay/bob-fanslow`
- Source of truth: [src/lib/microsites/accounts/frito-lay.ts](../../src/lib/microsites/accounts/frito-lay.ts)
- Supporting account context:
  - [docs/MODEX_FLOOR_PLAN.md](../MODEX_FLOOR_PLAN.md)
  - [docs/PHONE_LIST_TOP10.md](../PHONE_LIST_TOP10.md)
- Browser coverage: [tests/e2e/microsite-variants.spec.ts](../../tests/e2e/microsite-variants.spec.ts) covers the Bob Fanslow route

## General Mills

- Overview route: `/for/general-mills`
- Named-person routes:
  - `/for/general-mills/paul-gallagher`
  - `/for/general-mills/nisar-ahsanullah`
  - `/for/general-mills/ryan-underwood`
  - `/for/general-mills/zoe-bracey`
  - `/for/general-mills/lars-stolpestad`
- Source of truth: [src/lib/microsites/accounts/general-mills.ts](../../src/lib/microsites/accounts/general-mills.ts)
- Supporting account context:
  - [docs/research/paul-gallagher-generalmills-dossier.md](../research/paul-gallagher-generalmills-dossier.md)
  - [docs/research-dossiers-top10.md](../research-dossiers-top10.md)
  - [docs/MODEX_FLOOR_PLAN.md](../MODEX_FLOOR_PLAN.md)
  - [docs/PHONE_LIST_TOP10.md](../PHONE_LIST_TOP10.md)
- Browser coverage: [tests/e2e/microsite-variants.spec.ts](../../tests/e2e/microsite-variants.spec.ts) covers the Zoe Bracey route

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

## Notes

1. This index should only list routes backed by account config changes already committed or ready to commit.
2. Named-person routes belong here only when the copy is grounded in actual research, not a generic role hypothesis.
3. When a flagship account gains or loses a named-person route, update this file in the same commit.