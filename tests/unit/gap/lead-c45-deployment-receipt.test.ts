// @vitest-environment node
/**
 * C45 (the commercial-context audit, 2026-10-08): one deployment and configuration receipt. It keeps project
 * settings, the deployed environment and the local code apart; a baseline pointer that names another commit is
 * marked historical; a value that is not a flag word is never shown and a receipt that would carry one is refused;
 * an unread source is said as unread, never as healthy or empty.
 */
import { describe, expect, it } from 'vitest';
import { assertNoLeak, composeReceipt, liveDeployment, redactValues, showableFlag, type ReceiptInputs } from '@/lib/gap/health/deployment-receipt';

const SECRET = 'hs-pat-not-a-real-key-0123456789abcdef';
const base = (): ReceiptInputs => ({
  generatedAt: '2026-10-09T03:00:00.000Z',
  local: { commit: 'f9b149f9aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', branch: 'feat/gap-execution-engine', originMain: 'a195467fbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', dirty: false },
  project: { name: 'modex-gtm', id: 'prj_x', teamId: 'team_x' },
  deployments: [
    { id: 'dpl_new', state: 'READY', commit: 'a195467fbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', readyAt: '2026-10-09T02:00:00.000Z', url: 'modex-gtm-abc.vercel.app', aliases: [], target: 'production' },
    { id: 'dpl_old', state: 'READY', commit: 'ed9976e8cccccccccccccccccccccccccccccccc', readyAt: '2026-10-09T01:37:25.000Z', url: 'modex-gtm-def.vercel.app', aliases: [], target: 'production' },
    { id: 'dpl_err', state: 'ERROR', commit: 'deadbeefdddddddddddddddddddddddddddddddd', readyAt: null, url: null, aliases: [], target: 'production' },
  ],
  productionAlias: 'modex-gtm.vercel.app',
  envNames: [{ key: 'HUBSPOT_ACCESS_TOKEN', type: 'encrypted', targets: ['production'], updatedAt: null }, { key: 'GAP_OS_ENABLED', type: 'plain', targets: ['production'], updatedAt: null }, { key: 'PREVIEW_ONLY', type: 'plain', targets: ['preview'], updatedAt: null }],
  flags: [{ key: 'GAP_OS_ENABLED', value: showableFlag('GAP_OS_ENABLED', 'true'), type: 'plain' }, { key: 'GAP_CRM_LOG_METHOD', value: showableFlag('GAP_CRM_LOG_METHOD', 'connected_inbox'), type: 'plain' }, { key: 'GAP_AUTO_ENROLL_ENABLED', value: null, type: 'sensitive' }],
  localCrons: [{ path: '/api/cron/gap-briefing/', schedule: '5 * * * *' }],
  deployedCrons: null,
  baseline: { file: 'docs/gap/STABLE_BASELINE.md', line: 'Production SHA: ed9976e8 (PR #429, X19 + A06; Vercel `dpl_old` READY).', commit: 'ed9976e8' },
  health: { checkedAt: '2026-10-08T19:17:13.152Z', overall: 'DEGRADED', source: 'saved file', components: [{ key: 'mailbox', state: 'HEALTHY', label: 'Mailbox intake 6m ago', detail: 'Last successful run 6m ago.' }, { key: 'routing', state: 'DEGRADED', label: 'Recommendations refreshed 3d ago', detail: 'Last completed routing run 2026-10-05.' }] },
  unread: [],
});

describe('C45: the deployment receipt', () => {
  it('keeps local code, the deployed environment and the project settings apart; the newest READY production deployment is the live one; a stale baseline pointer is HISTORICAL', () => {
    const r = composeReceipt(base());
    expect(r).toMatch(/## 1\. Local code[\s\S]*## 2\. Deployed environment[\s\S]*## 3\. Project settings[\s\S]*## 4\. Baseline pointer[\s\S]*## 5\. Last successful source reads/);
    expect(r).toContain('Commit f9b149f9 on feat/gap-execution-engine (clean); origin/main a195467f.');
    expect(r).toContain('Local code is NOT the deployed commit (deployed a195467f).');
    expect(r).toContain('serves deployment dpl_new, state READY, commit a195467f, ready 2026-10-09T02:00:00.000Z (alias binding inferred');
    expect(r).toContain('Other recent production deployments: dpl_old READY ed9976e8 2026-10-09T01:37:25.000Z; dpl_err ERROR deadbeef.');
    expect(r).toContain('snapshotted at ITS build');
    expect(r).toContain('Production environment variables (2 names; values are never in this receipt): GAP_OS_ENABLED [plain], HUBSPOT_ACCESS_TOKEN [encrypted].');
    expect(r).toContain('GAP_AUTO_ENROLL_ENABLED=(not shown), GAP_CRM_LOG_METHOD=connected_inbox, GAP_OS_ENABLED=true');
    expect(r).toContain('HISTORICAL: that pointer names ed9976e8 and the deployed commit is a195467f');
    expect(r).toContain('Health read 2026-10-08T19:17:13.152Z (saved file): overall DEGRADED.');
    expect(r).toContain('- routing: DEGRADED. Recommendations refreshed 3d ago. Last completed routing run 2026-10-05.');
    expect(r).toContain('- Every source above was read.');
    expect(r).toMatch(/<!-- verified:2026-10-09 -->/);
  });

  it('an alias binding from the API wins over the newest READY; the pointer agrees when it names the deployed commit; local code that is the deployed commit says so', () => {
    const i = base();
    i.deployments[1].aliases = ['https://modex-gtm.vercel.app'];
    i.local.commit = 'ed9976e8cccccccccccccccccccccccccccccccc';
    expect(liveDeployment(i.deployments, i.productionAlias)?.id).toBe('dpl_old');
    const r = composeReceipt(i);
    expect(r).toContain('serves deployment dpl_old, state READY, commit ed9976e8');
    expect(r).toContain('(alias binding from the API: https://modex-gtm.vercel.app)');
    expect(r).toContain('That pointer AGREES with the deployed commit (ed9976e8).');
    expect(r).toContain('Local code IS the deployed commit (deployed ed9976e8).');
  });

  it('a value that is not a flag word is never shown; a receipt that would carry a forbidden value is refused; an unread source is said as unread, never as healthy', () => {
    expect(showableFlag('GAP_OS_ENABLED', 'true')).toBe('true');
    expect(showableFlag('GAP_AI_MONTHLY_CEILING_USD', '25')).toBe('25');
    expect(showableFlag('GAP_CRM_LOG_METHOD', 'connected_inbox')).toBe('connected_inbox');
    expect(showableFlag('GAP_OS_ENABLED', SECRET)).toBeNull();
    expect(showableFlag('HUBSPOT_ACCESS_TOKEN', 'true')).toBeNull();
    expect(showableFlag('GAP_AGENT_SECRET', 'abc')).toBeNull();
    expect(showableFlag('GAP_OS_ENABLED', 'a1b2c3')).toBeNull();
    expect(showableFlag('GAP_OS_ENABLED', 'hs-pat-x')).toBeNull();
    const i = base();
    i.flags.push({ key: 'GAP_OS_ENABLED', value: showableFlag('GAP_OS_ENABLED', SECRET), type: 'plain' });
    i.health = null;
    i.unread = [{ source: 'vercel /v9/projects/prj_x/env', reason: 'HTTP 403' }];
    const r = composeReceipt(i);
    expect(r).not.toContain(SECRET);
    expect(r).toContain('Not read this run: the health route needs a seller session');
    expect(r).toContain('Absent here means unread, not healthy.');
    expect(r).toContain('- vercel /v9/projects/prj_x/env: HTTP 403');
    expect(() => assertNoLeak(r, [SECRET])).not.toThrow();
    expect(() => assertNoLeak(`${r}\n${SECRET}`, [SECRET])).toThrow(/not a flag word/);
    expect(() => assertNoLeak(r, ['ok', '1'])).not.toThrow();
    // A configuration value quoted by a health line (the sender address) is redacted by its key; a token is redacted without a name; the guard then passes.
    const quoted = `${r}\nSending as casey@yardflow.ai. token=${SECRET}`;
    const red = redactValues(quoted, [{ key: 'GAP_GMAIL_USER_EMAIL', value: 'casey@yardflow.ai' }, { key: null, value: SECRET }]);
    expect(red).toContain('Sending as [value of GAP_GMAIL_USER_EMAIL]. token=[redacted]');
    expect(() => assertNoLeak(red, ['casey@yardflow.ai', SECRET])).not.toThrow();
  });
});
