# Secret Rotation & CI Configuration

## Secrets Inventory

| Secret | Location | Rotation Cadence | Owner |
|--------|----------|-----------------|-------|
| `DATABASE_URL` | Vercel + .env | On compromise | Casey |
| `AUTH_SECRET` | Vercel + .env | 90 days | Casey |
| `GOOGLE_CLIENT_ID` | Vercel + .env | On compromise | Casey |
| `GOOGLE_CLIENT_SECRET` | Vercel + .env | 90 days | Casey |
| `GOOGLE_REFRESH_TOKEN` | Vercel + .env | On revocation | Casey |
| `GEMINI_API_KEY` | Vercel + .env | 90 days | Casey |
| `OPENAI_API_KEY` | Vercel + .env | 90 days | Casey |
| `CRON_SECRET` | Vercel + .env | 90 days | Casey |
| `UNSUBSCRIBE_SECRET` | Vercel + .env | 180 days | Casey |
| `SENTRY_DSN` | Vercel + .env | On compromise | Casey |
| `HUBSPOT_ACCESS_TOKEN` | Vercel + .env (future) | 180 days | Casey |
| `HUBSPOT_WEBHOOK_SECRET` | Vercel + .env (future) | On compromise | Casey |

## Rotation Procedure

1. Generate new secret value
2. Update in Vercel dashboard (Settings > Environment Variables)
3. Update in `.env` / `.env.local` for local dev
4. Redeploy: `vercel --prod` or push to main
5. Verify the app works with the new secret
6. Revoke the old secret (if applicable, e.g., API keys)

## CI/CD Configuration

### GitHub Actions (`.github/workflows/`)

**Current**: `e2e.yml` runs Playwright tests against production URL.

**Recommended additions** (Sprint 0.9):

1. **Unit test job**: Run `npx vitest run` on every PR
2. **Type check job**: Run `npx tsc --noEmit` on every PR
3. **Secret scanning**: GitHub's built-in secret scanning is enabled by default on public repos

### Required GitHub Secrets

For CI to run HubSpot integration tests (Sprint 1+):
- `HUBSPOT_ACCESS_TOKEN` — test portal token
- `UNSUBSCRIBE_SECRET` — for email template tests

### Vercel Environment Variables

All secrets must be set in Vercel for each environment:
- **Production**: All secrets
- **Preview**: All secrets (same values, or test-specific override)
- **Development**: Use `.env.local` (never committed)

## .env.local Template

```bash
# Copy to .env.local and fill in values
DATABASE_URL=
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GMAIL_USER_EMAIL=casey@freightroll.com
FROM_EMAIL=casey@freightroll.com
FROM_NAME=Casey Larkin - YardFlow
GEMINI_API_KEY=
OPENAI_API_KEY=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
UNSUBSCRIBE_SECRET=
SENTRY_DSN=
# Future
# HUBSPOT_ACCESS_TOKEN=
# HUBSPOT_PORTAL_ID=
# HUBSPOT_LOGGING_ENABLED=false
# HUBSPOT_SYNC_ENABLED=false
# INBOX_POLLING_ENABLED=false
```
