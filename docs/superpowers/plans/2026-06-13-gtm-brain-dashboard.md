# YardFlow GTM Brain Dashboard: architecture + sprint roadmap

> Master roadmap. Each phase spawns its own task-level TDD plan (superpowers:writing-plans) when executed. Two-session program: the brain (clawd-control-plane) and the face (modex-gtm).

**Goal:** One canonical dashboard in the modex-gtm Vercel app that is the visual front end of the brain: the single source of truth surfacing all GTM activity (every send across email, DM, and text; yardflow.ai pageviews; social post engagement; HubSpot deals; campaigns; leads; intent), reusing the real /discovery components, with Slack as a parallel push projection of the same canonical ledger.

**The one idea that makes it work:** the canonical intel layer's **signal ledger is the write-ahead source for every signal.** Slack and the dashboard are both read projections of it. That is what makes Slack canonical (it can never hold a signal the dashboard lacks, or vice versa) and what makes the dashboard the source of truth that HubSpot, Gmail, PostHog, and Apollo each cannot be on their own.

## Architecture

Three faces of one brain:
- **Memory (clawd):** the canonical intel layer. An entity store (Accounts by domain, Persons by email/phone/handle, Campaigns by tag) plus an append-only **signal ledger** (every event: send, open, click, reply, pageview, social_post, social_engagement, dm, text, deal_change, intent, meeting). Every fact and every signal carries provenance {source, observed_at, confidence}.
- **Voice (Slack):** a curated push projection. notify() reads the ledger and pushes the high-signal subset to #yardflow-intent.
- **Face (modex Vercel):** the complete visual projection. The activity feed (the full ledger, the Slack stream as data), entity browse (all accounts/contacts/deals), campaign lenses (Allentown and every other), the attention/triage queue (what needs you now), and rollups (pulse, funnels, pipeline, TAM coverage). Reuses /discovery's real components.

**Ownership (the answer to "clawd or us"):** both, cleanly split. The brain (ledger, ingest connectors, identity resolution, projections) is clawd's, built in the clawd session. The face (the dashboard, its actions) is modex's, built in this session. They meet at the projection contracts, the pattern we already proved with the command-center contract. Do not collapse them into one session; the brain must run where the always-on ingest and the daemon live (clawd), and the dashboard must run where /discovery and the Vercel app live (modex).

**Canonicality of Slack (explicit):** today some Slack posts are emitted by producers directly (clawd notify(), modex SLACK_WEBHOOK_URL) without a guaranteed ledger write. Phase 1 inverts this: every signal writes to the ledger first, then notify() projects the subset to Slack. After Phase 1, Slack is a view, not a producer. That is "Slack as canonical as it should be."

## What we have vs what we surface (the data-access answer)

The records exist. HubSpot holds the full corpus: all contacts and companies (including the ~6,881 TAM accounts and the cold-contact quarantine), all deals, all lifecycle stages. The canonical ledger already ingests HubSpot (Phases 1-3 of the canonical-intel-layer plan). What is missing is **surfacing**: the dashboard and the Slack stream today expose only the hot subset (new SQLs, account pulse, the Allentown cohort). So this is not a data-availability gap, it is a projection gap. Phase 3 adds the full-corpus entity-browse projection so the dashboard sees every lead and contact, not just the SQLs.

## The practical gaps you are missing (you asked)

1. **Identity resolution across every channel, not just email and domain.** A person is a HubSpot contact, an Apollo record, an anonymous yardflow.ai session, an X handle, a phone number for texts, a LinkedIn profile. The resolver must join all of these to one Person. The contract already has the identity object and the web-match edge; it needs phone and social-handle edges too. Without this, texts and DMs float free of the people they belong to.
2. **Channels not yet ingested.** Current ingest: HubSpot, Gmail, PostHog, Apollo. Missing for your stated scope: Twilio (texts, connected), Twitter/X (posts, engagement, DMs; clawd already has twitter_client), LinkedIn (DMs/social via the rig), and HubSpot deals as first-class pipeline signals. Each is a new ingest connector in Phase 2.
3. **Sends are multi-system.** Sends fire from the modex Outbox (Gmail), clawd outreach drips (Gmail), and soon DMs and texts. They must all land in the ledger as one `send` event type with a `channel`, or "all sends" is a lie. Phase 1 backfill plus Phase 2 connectors unify this.
4. **Historical backfill.** "Existing leads and campaigns that have run" means the ledger must backfill past sends (EmailLog, outreach_sends.jsonl), past campaigns, and existing contacts/deals, not only go-forward. A dashboard that starts empty is not the source of truth. Phase 1 includes a bounded backfill.
5. **The attention layer (the difference between a data dump and a brain).** A surface with everything is noise unless it ranks what needs you now: hot replies, overdue follow-ups, new SQLs, accounts going cold, a tour to confirm. This is the account-pulse and nextAction logic generalized into a triage queue. Phase 3 projection plus Phase 4 panel. This is the single most important thing that makes it feel like a brain and not a database viewer.
6. **Actionability.** /discovery already lets you act (Hand to Clawd, Outbox send). The brain dashboard must let you act too (approve/send, book a tour, advance a deal, snooze, assign), and every action must itself write a signal to the ledger so the brain learns from its own hands. Phase 5. Decide v1 scope (see Open Decisions).
7. **Near-real-time.** Slack is push; the dashboard should be near-live. The ledger is append-only, so the dashboard polls a cursor (or SSE later). Decide the refresh model (Open Decisions).
8. **A campaign registry.** Allentown is one tag. The proximity drip, the /for spear pages, the tracked doc sends, and future campaigns are all campaigns. Model a registry (tag, type, cohort, goal, funnel) so the dashboard is multi-campaign, not Allentown-hardcoded.
9. **Multi-repo reach.** yardflow.ai pageviews come from Flow-State- via PostHog (already), the /demo and /for surfaces from modex, social from clawd's twitter_client and the rig. The ledger ingests from sources, not repos, so the dashboard is repo-agnostic by construction; the work is wiring each source, not each repo. (sigil is unrelated; out of scope.)
10. **Rate limits and cost.** Continuous ingest of X, Twilio, PostHog, and HubSpot has quotas and the canonical session already hit connection-pool starvation. Ingest must be incremental, watermarked, batched, and rate-aware. Bake this in from Phase 2, do not retrofit it.
11. **Reconciliation conflicts at scale.** The verified-recent-wins rule plus human override exists for the Allentown cohort. Across the full corpus it will fire constantly (Apollo vs HubSpot titles, multiple emails per person). The conflict engine and its override store must be first-class in the projections, not a per-cohort special case.
12. **De-dup of the ledger itself.** The same real-world event can arrive twice (a HubSpot webhook and a Gmail poll both see one reply). The ledger needs an idempotency key per signal (channel + external_id) so the activity feed and the funnels do not double-count.

## Phased roadmap

Each phase is independently shippable and testable. Owner in brackets.

### Phase 0: Signal model + projection contracts [both sessions]
- [ ] Define the unified signal model: `Signal { id, entity_refs(person?, account?, campaign?), type, channel, direction(in/out), occurred_at, source, idempotency_key, payload, provenance }`. Enumerate types and channels.
- [ ] Extend the entity model: identity edges for phone (Twilio) and social handle (X/LinkedIn) added to the resolver inputs.
- [ ] Define the five projection contracts the dashboard consumes: entity-browse, campaign (generalized), signal-feed, attention/triage, rollups. Extend the existing command-center contract doc.
- [ ] Define the campaign registry shape.
- Exit: a written contract both sessions build against (the analog of the command-center contract that already worked).

### Phase 1: Ledger as the write-ahead source + backfill [clawd]
- [ ] Invert Slack: every notify() call writes a Signal to the ledger first, then projects to Slack. Same for modex's SLACK_WEBHOOK_URL posts (route through an ingest call).
- [ ] Idempotency keys on every signal write.
- [ ] Backfill: EmailLog (modex) and outreach_sends.jsonl (clawd) into send/open/reply signals; existing HubSpot contacts, companies, and deals into entities + deal_change signals; past campaign cohorts into membership.
- Exit: Slack is a read projection; the ledger holds the historical corpus, not just go-forward.

### Phase 2: Ingest the missing channels [clawd]
- [ ] Twilio connector: text send/receive as `text` signals, phone as an identity edge.
- [ ] Twitter/X connector: our posts, engagement on them, and inbound DMs as `social_post`/`social_engagement`/`dm` signals, handle as an identity edge.
- [ ] LinkedIn connector (via the rig where API is absent): DMs and post engagement.
- [ ] HubSpot deals connector: pipeline stage changes as `deal_change` signals, deal as an entity linked to account.
- [ ] All connectors incremental, watermarked, batched, rate-aware.
- Exit: every channel you named flows into the ledger with provenance.

### Phase 3: The dashboard projections [clawd]
- [ ] entity-browse: all accounts/contacts/deals, searchable and filterable, paged, with resolved facts + provenance.
- [ ] campaign (generalized): any tag, plus the campaign registry; the Allentown view becomes one instance.
- [ ] signal-feed: the activity stream, filterable by channel/entity/type, cursor-paginated for near-real-time.
- [ ] attention/triage: the ranked "what needs you now" queue (hot replies, overdue follow-ups, new SQLs, cooling accounts, tours to confirm) with the reason and the recommended action.
- [ ] rollups: account pulse, campaign funnels, pipeline by stage, TAM coverage, send volume by channel.
- Exit: five stable, authed endpoints the dashboard reads.

### Phase 4: The dashboard [modex, this session]
- [ ] 4a: Fix the Allentown lens first. Reuse the real `CorridorMap` (Leaflet satellite, Primo anchor, real pins), delete the recreated motif, and render the contacted/invited people with their real send/open/reply state tied to the same Contacted/In-CRM badges /discovery shows.
- [ ] 4b: The home command surface. Left: the attention/triage queue. Center: entity browse + the map + campaign lenses. Right: the live activity feed (the Slack stream as data). Top: rollup tiles.
- [ ] 4c: Near-real-time refresh of the feed and attention queue (cursor poll; SSE later).
- [ ] 4d: frontend-design pass (superpowers:frontend-design) for the distinctive operator aesthetic, reusing the design system already delivered.
- Exit: the canonical GTM home in the Vercel app, reusing real components, no mocks.

### Phase 5: Actionability [modex]
- [ ] Act from the dashboard: approve/send a draft, book/confirm a tour, advance a deal, snooze, assign, hand-to-clawd. Wire to existing actions plus new ones.
- [ ] Every action writes a Signal to the ledger (the brain learns from its hands).
- Exit: the dashboard is the brain's hands, not just its eyes.

### Phase 6: The brain feel + hardening [both]
- [ ] Tune the attention ranking (the make-or-break for "feels like a brain").
- [ ] Provenance UX everywhere; conflict override store first-class.
- [ ] Performance: apply the ledger scaling lessons (batched reads/writes, serial daemon ingest, connection-pool discipline).
- [ ] Multi-campaign + multi-source generalization verified end to end.

## Open decisions (yours)

1. **v1 actionability:** read-only first (fastest to the source-of-truth value), or actionable from day one (more useful, more scope). Recommendation: read-only Phase 4, actions in Phase 5, so you get the brain's eyes before its hands.
2. **Real-time model:** cursor-poll (simple, ship now) vs SSE/websocket (live, more infra). Recommendation: cursor-poll v1, SSE later.
3. **First campaigns to model beyond Allentown:** recommend the proximity drip and the tracked doc sends, since they already produce signals.
4. **Scope of v1 corpus:** all TAM accounts at once, or active-pipeline + active-campaigns first. Recommendation: active first, then widen, to avoid the scaling cliff on day one.

## How to proceed

- Phase 0 is the unlock and it is a contract, not code. I write it (this session), the clawd session reviews, same as the command-center contract.
- The clawd session runs Phases 1-3 (brain). This session runs Phase 4 (face), starting with 4a (fix Allentown to reuse the real map and show the contacted people), which is valuable on its own and unblocks nothing else.
- Phases 5-6 follow once the face is real.
- Keep both sessions; the split is the architecture, not an accident.
