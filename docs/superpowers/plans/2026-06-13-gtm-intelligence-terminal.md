# YardFlow GTM Intelligence Terminal: architecture + sprint roadmap

> Supersedes the campaign-dashboard framing. This is the GTM/RevOps intelligence terminal: a read-only, all-knowing surface for sales, marketing, social, web analytics, and external intel. The Machine plus a Bloomberg terminal for our go-to-market. Two-session program: the brain (clawd-control-plane) and the face (modex-gtm Vercel).

**Goal:** One read-only terminal in the modex Vercel app that becomes the single place we go to see everything and decide what to do: full yardflow.ai web analytics over any time range, all sales/marketing/GTM/social activity past-present-future, and external intelligence (news, social, Reddit, blogs, commodity and freight indices, macro and micro factors) about our TAM, their contacts, and our market. It replaces the reporting in HubSpot, PostHog, and the other platforms by ingesting them (or their sources) and surfacing, on the homescreen, the intelligence that is most prescient at any given moment. We cannot manage what we cannot measure; this is how we bet on winners, cut losers, and optimize without operating in the silos we sell against.

**Locked decisions (from Casey):**
1. **Read-only.** Not an action surface. A measurement and intelligence surface to read and react. It replaces HubSpot dashboards, PostHog, and other trackers as a reporting layer.
2. **Live by default (SSE/stream), not poll.** Feels like a terminal. Poll only as a pragmatic fallback for a few high-cost or low-cadence external sources, never as the default.
3. **Not a campaign dashboard.** A GTM/RevOps intelligence terminal: all campaigns, all untagged activity, plus external intel. Campaigns are one lens among many.
4. **Scan everything, surface the prescient subset.** Do not dump the whole corpus on screen. Continuously scan the TAM, their contacts, the news, topics, trends, and macro/micro factors, then surface what matters now. Eagle Eye, not a spreadsheet.

## Architecture: three layers of one brain

**1. Senses + memory (clawd): the canonical signal ledger.**
Every signal, internal and external, lands in one append-only ledger, each linked to an entity (account, contact, or topic) with provenance and an idempotency key.
- Internal GTM signals: sends (email, DM, text), web pageviews, social posts and engagement, CRM and deal changes, campaign membership, intent.
- External intel signals: news, LinkedIn/Reddit/blog mentions, commodity and freight indices, macro indicators, competitor and customer moves.
- External signals pass a **relevance gate**: linked to our TAM, our accounts, or our thesis (yards as the cap on realized capacity, freight, logistics) or dropped. Unfiltered external feeds are noise; entity-linking is what makes them intel.

**2. Cortex (clawd): resolution + analytics rollups.**
- Entity resolution: one truth per account and contact across every channel (email, domain, phone, X/LinkedIn handle, web session), with the verified-recent-wins conflict engine and human override.
- Time-series rollups: web traffic by day/week/month/year, page performance (best/worst, by source), pipeline by stage, send and engagement trends, social reach. The event ledger answers "what happened"; the rollups answer "how are we trending", fast. This layer is what actually replaces the HubSpot and PostHog reports.

**3. Consciousness + face: synthesis + the terminal.**
- **The synthesis layer (the Machine):** an LLM over the ledger and rollups that produces the homescreen, the answer to "what do Jake and I need to know right now". This is the product. It is not a SQL rollup; it reads the corpus, ranks by prescience and pertinence, and writes the brief: the hot account, the cooling deal, the news that moves a TAM account, the page that spiked, the trend worth a post. It changes through the day.
- **The terminal (modex Vercel, read-only, live):** the homescreen synthesis up top, then standard widgets you can filter and drill into: web analytics, sales activity, most-engaged contacts, top signals, pipeline, TAM coverage, social. Reuses the real /discovery components (the map, the worklist, the badges). You can also ask it (the Clawd brain, visualized: ask a question, see the answer plus the underlying records).

Slack stays a push-projection of the same ledger (the voice). The terminal is the face. Brain = clawd, face = modex.

## What you are still missing (you asked)

1. **The synthesis homescreen is the actual product, and it is the hard part.** Aggregation is easy; deciding what is most pertinent right now is an LLM reading the whole corpus and writing a brief. Budget the most design and iteration here. Everything else is plumbing to feed it.
2. **External intel must be entity-linked and relevance-gated or it drowns you.** News, Reddit, and blogs are infinite. Every external signal links to a TAM account, a contact, or a tracked topic, or it does not enter. This gate is a first-class component, not a filter you bolt on later.
3. **Time-series analytics is a separate layer from the event ledger.** "Traffic any day/week/month/year, best and worst pages" needs materialized rollups and cohort queries, not a scan of raw events. Build the rollup layer alongside the ledger or the analytics will be slow and the platform-replacement promise fails.
4. **Replacing HubSpot and PostHog means matching their table stakes first.** Funnels, traffic sources, top pages, pipeline by stage, contact activity. The boring reports have to be right before the fancy intel earns trust. Do not skip them.
5. **Ask-the-brain belongs in the terminal.** The Clawd bot already answers questions in Slack. The terminal should embed that: type a question, get the synthesized answer plus the records behind it. Read-only does not mean static.
6. **External data sources cost money and have quotas.** News, social, commodity, and freight-rate APIs are paid and rate-limited. Scope which sources, set budgets, and ingest incrementally. Pick the few that matter (freight indices, the TAM's industry news, our own social) before the long tail.
7. **Relevance and ranking need feedback.** What counts as "prescient" should learn from what you and Jake actually act on (open, reply, click, dismiss). Without a feedback loop the homescreen ossifies. Capture interactions as signals (read-only on the data, but it logs what you looked at).
8. **Provenance and trust at this scale.** When the terminal says "UNFI is heating up", you need to see why and from where in one click, or you will not trust it enough to bet on it. Provenance is the credibility layer.

## Phased roadmap

The architecture scales to the full vision; we build it in waves. Owner in brackets. Each phase spawns its own task-level TDD plan at execution.

### Phase 0: Signal model + relevance gate + projection contracts [both]
- [ ] Unified signal model covering internal and external signals, with entity refs, idempotency, provenance, channel, direction.
- [ ] The relevance gate spec (how an external signal links to a TAM entity or topic, or is dropped).
- [ ] The projection contracts the terminal reads: entity-browse, time-series analytics (web + sales), signal-feed, the synthesis/homescreen, rollups. Extend the existing contract pattern.

### Phase 1: Ledger as write-ahead source + rollup layer + backfill [clawd]
- [ ] Invert Slack: every signal writes to the ledger first, Slack projects the subset.
- [ ] The time-series rollup layer (web traffic, page performance, pipeline, send/engagement trends).
- [ ] Backfill: EmailLog, outreach_sends, PostHog history, HubSpot contacts/companies/deals, past campaigns.

### Phase 2: Internal channel ingest [clawd]
- [ ] Full web analytics from PostHog (sessions, pages, sources, funnels), not just intent pings.
- [ ] Twilio (texts), X (posts/engagement/DMs), LinkedIn (DMs/posts), HubSpot deals as signals.
- [ ] Identity edges for phone and social handle. Incremental, watermarked, rate-aware.

### Phase 3: External intel ingest + relevance gate [clawd]
- [ ] News (TAM accounts + industry), Reddit/blogs/forums, our and competitor social, freight/commodity indices, macro indicators.
- [ ] Entity-linking + relevance gate on every external signal. (clawd's signal_hunt is the seed.)

### Phase 4: The synthesis layer (the Machine) [clawd]
- [ ] LLM over the ledger + rollups that writes the homescreen brief: ranked, pertinent, with provenance and recommended read/react. The interaction feedback loop.

### Phase 5: The terminal [modex, this session]
- [ ] 5a: Fix the Allentown lens first (reuse the real map, show the contacted people) as the first proof.
- [ ] 5b: The homescreen (synthesis brief up top) + standard widgets (web analytics, sales activity, most-engaged contacts, top signals, pipeline, TAM coverage), read-only, live, filterable, drill-down, reusing /discovery components.
- [ ] 5c: Ask-the-brain embedded (query, answer, records).
- [ ] 5d: frontend-design pass for the terminal aesthetic.

### Phase 6: Trust, tuning, hardening [both]
- [ ] Provenance everywhere; the synthesis ranking tuned against real interaction feedback; performance hardened (the ledger scaling lessons); platform-parity reports verified so it can truly replace HubSpot/PostHog reporting.

## How to proceed

The full Machine is a platform, not a sprint, so we build the spine first and layer intelligence onto it. Concretely: Phase 0 is a contract, not code, and I write it next (this session), the clawd session reviews it. That hands the clawd session Phases 1-4 (senses, cortex, external intel, synthesis) while this session takes Phase 5 (the terminal), starting with 5a, fixing the Allentown view to reuse the real map and show the people we invited, which is valuable immediately and blocks nothing. v1 is the GTM-activity terminal plus a first synthesis homescreen, replacing HubSpot and PostHog reporting for our own data; external intel and the full Machine follow as the next waves.
