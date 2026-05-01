# Queue Implementation Decision

## Decision
Use **Vercel Cron + Prisma polling** as the queue architecture for one-pager generation jobs.

## Why this is the best fit
- The repo already includes a mature cron pattern:
  - `/api/cron/*` routes
  - secure `CRON_SECRET` gating
  - `src/lib/cron-monitor.ts` for health status and failure tracking
  - an admin page at `/admin/crons`
- This keeps the implementation within the existing platform stack and avoids adding a new queue provider.
- It is the least-risk path for the current phase:
  - no extra infrastructure dependencies
  - uses existing Vercel deployment model
  - leverages Prisma for state tracking and retries

## Compared options

### Vercel Cron + Prisma polling (selected)
- Pros:
  - Reuses existing cron architecture already deployed in this repo
  - Minimal new dependency footprint
  - Fits Vercel App Router / Railway deployment constraints
  - Easy to monitor through existing cron health UI
- Cons:
  - Not as feature-rich as a dedicated queue service
  - Requires careful idempotency and state management in DB

### Upstash / Bull queue
- Pros:
  - Built-in job retry and backoff semantics
  - Better long-running job support
- Cons:
  - Additional dependency and infra to maintain
  - Potential cost and complexity for a single-tenant outreach platform
  - Not currently present in repo or package dependencies

### Custom serverless scheduler
- Pros:
  - Flexible, tailored to exact workflow
- Cons:
  - More engineering cost up front
  - More brittle than leveraging existing cron routes
  - Unnecessary for the first implementation phase

## Implementation guidance
- Use a new `GenerationJob` model in Prisma to persist job state.
- Create batch generation endpoints under `/api/ai/`.
- Process queued jobs via a new cron route like `/api/cron/process-one-pagers`.
- Maintain health and retry metadata in `system_config` or a dedicated `GenerationJob` table.

## Next action
Implement Sprint 1 with the queue architecture already chosen.
