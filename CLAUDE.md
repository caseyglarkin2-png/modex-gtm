# modex-revops-os

Next.js GTM / RevOps application (deployed to modex-gtm.vercel.app).

---

## Current work

Current work is visible in `git log` — do not trust a dated banner here to be
current. Open owner items live in the Obsidian vault ledger:
`10_Operating_System\RETIREMENT-HANDOFF.md`.

---

## One writer per worktree

A mutation/adversarial reviewer and the lead writer must NEVER share a writable
worktree. On 2026-08-13 they did: a reviewer was mutation-testing
`scripts/yard-audit/evidence.ts` while the lead edited the same file. The lead
was shown a diff where the `rejected` early-return had been deleted, labelled as
an intentional edit. Committing that would have made a rejected facility
ship-eligible — a closed or divested yard reaching a buyer, which is the exact
failure the reviewer was hired to prevent.

  IMPLEMENTATION worktree   one writer, the lead
  MUTATION worktree         disposable, exclusive to the mutation agent
  REVIEW worktree           reviewer owns it, the lead never edits it

Before integrating anything a reviewer touched: stop the agent, read the diff
against what you actually wrote, and confirm the source is restored. If ownership
of a worktree changes, release the previous owner explicitly first.

The general rule this is an instance of: when a tool reports a file as
"modified, intentional", that is not evidence YOU made the change. Check the diff
against your own intent.

## 🎯 THE PROSPECT-FACING STANDARD — /demo, /for, microsites (2026-07-09)

Everything this app serves under **yardflow.ai** (the `/demo` subtree, `/for`
packs, microsites) holds the same bar as the native site. The canon lives in
`Flow-State-/flow-state-site/CLAUDE.md` + `docs/DESIGN-SYSTEM.md`; the parts
enforced HERE:

- **Voice:** no em dashes, no "throughput" (say production capacity), yards
  plural, measured-vs-modeled labeled. `npm run validate:packs` is the gate —
  it runs VOICE CI over all 57 demo packs and must pass before any pack ships.
  The AI copy context (`src/lib/ai/yardflow-context.ts`) carries the canon
  positioning; generated copy inherits whatever it says, so keep it current.
- **Number canon:** 48→24 measured · 24 sites live · ~5% measured · $1M+/site
  MODELED · 260 sites committed (100% of Primo, owner-confirmed 2026-07-09,
  Primo-specific). Never hand-type a variant.
- **Chrome:** `src/components/demo/demo-chrome.tsx` mirrors the canonical top
  bar (Product, Solutions, Demo, ROI, Research→/resources) and the canonical
  CTA "Book a Yard Network Audit". If Flow-State- changes
  `config/navigation.ts`, mirror it here.
- **SEO:** microsites are noindexed by design (sales weapons, not search
  bait); canonical/OG URLs are absolute yardflow.ai WITH trailing slash
  (`buildMicrositeAbsoluteUrl` enforces it). The title template is
  "%s | YardFlow by FreightRoll" — no em dash.
- **Deploy:** push main → Vercel; verify the LIVE yardflow.ai/demo/* pages
  after (the proxy adds failure modes the preview doesn't show).

## GAP Prospecting OS (2026-09-23)

The hypothesis, BID, disposition, routing and learning layer lives under `src/lib/gap/**`, `src/app/gap/**`, `src/app/api/gap/**`, `scripts/gap/**` and `tests/unit/gap/**`, behind the call-time `GAP_*` flags in `src/lib/gap/flags.ts` (all default off; with them unset every GAP surface answers 404 and no GAP code writes anything). Production has run the manual/shadow core since 2026-09-24; which flags are on is recorded in the spec's "GAP CORE LIVE" block, and the runtime phase brief (6A-6F, Sprint 7) is `docs/GAP_RUNTIME_HANDOFF.md`. The living spec and ticket ledger is `docs/GAP_PROSPECTING_OS.md`; do not create a second plan. Schema invariants live in `prisma/sql/2026-09-23-gap-os.sql` and must be re-applied after every `prisma db push`, then proven with `scripts/gap/verify-triggers.ts`. The Sprint 1 demo is `scripts/gap/e2e-sprint1.ts` (scratch database only; it refuses any other host). Sprint 3: `POST /api/gap/compile` runs the message compiler on one step, `/gap/preview/[hypothesisId]` shows the per-step compile report and emits the shadow enroll row through `POST /api/gap/enroll`, and the Sprint 3 demo is `scripts/gap/e2e-sprint3.ts` (scratch only; report in `docs/gap/sprint3-e2e-latest.md`). Sprint 4: `/gap/replies` (reply triage) and `/gap/call/[personaId]` (call mode) run over `POST /api/gap/dispositions`, `POST /api/gap/bids`, `GET /api/gap/replies`, `POST /api/gap/replies/[id]/suggest` and `GET /api/gap/call/[personaId]`; the UI types in `src/lib/gap/ui/gap-api-client.ts` are the route shapes, pinned by `tests/unit/gap/contract-parity.test.ts`, and the Sprint 4 demo is `scripts/gap/e2e-sprint4.ts` (scratch only; needs GAP_MESSAGE_COMPILER_ENABLED and GAP_REPLY_CLASSIFICATION_ENABLED on with the mirror and auto-enroll flags off; report in `docs/gap/sprint4-e2e-latest.md`).
