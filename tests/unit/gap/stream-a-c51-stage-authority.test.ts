// @vitest-environment node
/**
 * C51 (the commercial-context audit, 2026-10-08): cross-system authority for CRM stages. A deal stage is HubSpot's to
 * answer under a complete read; GAP's ledger never moves or reports one; `deal_advanced` needs the CRM's stage row.
 * The fixture sent_t1 (a first touch sent, and every other send, reply, obligation and meeting outcome) never
 * advances a stage. Every writer of a stage is named in the registry and the doc with its owner and gate, and no
 * module under src/lib/gap imports a stage writer or writes dealstage.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FORBIDDEN_IN_GAP, STAGE_WRITERS, dealStage, stageChangedFromCrm, stageWords } from '@/lib/gap/opportunity/stage-authority';
import { dealCoverageFrom } from '@/lib/gap/work/deal-coverage';
import { DEAL_STAGE_CHANGED, projectActivity, type LedgerRow } from '@/lib/gap/work/activity';
import { COMMITMENT_EVENT } from '@/lib/gap/work/commitment-model';
import { CRM_DEAL_PROPERTIES } from '@/lib/gap/deals/crm-model';
import type { InDealsSummary } from '@/lib/gap/deals/in-deals';

const ROOT = process.cwd();
const GAP = join(ROOT, 'src/lib/gap');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

const AT = new Date('2026-10-08T15:00:00Z');
const row = (kind: string, payload: unknown, over: Partial<LedgerRow> = {}): LedgerRow => ({ kind, subject_type: 'routing_decision', subject_id: 'dec-1', actor: 'casey@freightroll.com', payload, created_at: AT, ...over });

const summary = (status: 'complete' | 'unavailable', stage = 'presentationscheduled'): InDealsSummary => ({
  status, count: status === 'complete' ? 1 : null, openDeals: 1, unresolved: [], checkedAt: '2026-10-08T14:55:00.000Z',
  accounts: status === 'complete' ? [{ accountName: 'Kenco Logistics', alsoRecordedAs: ['Kenco'], dealContacts: 2, people: [], known: 2, deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage, lastActivityAt: null, closeDate: null, nextStep: null, contactIds: ['217664765537'] }] }] : [],
});

describe('C51: nothing in GAP writes a deal stage', () => {
  it('no module under src/lib/gap imports a HubSpot deal writer or the local pipeline stage mover, and none writes dealstage', () => {
    const files = walk(GAP);
    expect(files.length).toBeGreaterThan(100);
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const name of FORBIDDEN_IN_GAP) if (new RegExp(`\\b${name}\\b`).test(src) && !f.endsWith('stage-authority.ts')) offenders.push(`${f.slice(ROOT.length + 1)}: ${name}`);
      // A write is `dealstage:` inside an object literal; a read is `.dealstage` or the property name in a read list.
      if (/\bdealstage\s*:/.test(src)) offenders.push(`${f.slice(ROOT.length + 1)}: dealstage write`);
      if (/basicApi\.update\(|basicApi\.create\(/.test(src) && /deals/.test(src) && /dealstage/.test(src)) offenders.push(`${f.slice(ROOT.length + 1)}: deal API write with dealstage`);
    }
    expect(offenders).toEqual([]);
    expect([...CRM_DEAL_PROPERTIES]).not.toContain('dealstage');
    expect(readFileSync(join(GAP, 'hubspot-mirror.ts'), 'utf8')).not.toMatch(/dealstage/);
    expect(readFileSync(join(GAP, 'crm-sync.ts'), 'utf8')).not.toMatch(/dealstage/);
  });

  it('every stage writer is named in the registry and the doc with its owner and gate; every modex writer in the registry exists where it says; the doc is stamped', () => {
    const doc = readFileSync(join(ROOT, 'docs/gap/CRM_STAGE_AUTHORITY.md'), 'utf8');
    expect(doc).toMatch(/<!-- verified:\d{4}-\d{2}-\d{2} -->/);
    for (const w of STAGE_WRITERS) {
      expect(doc, `${w.fn} named in the doc`).toContain(w.fn);
      expect(doc, `${w.module} named in the doc`).toContain(w.module);
      expect(w.owner.length).toBeGreaterThan(0);
      expect(w.gate.length).toBeGreaterThan(0);
      expect(w.module.startsWith('src/lib/gap')).toBe(false);
      if (w.system === 'modex-gtm') expect(readFileSync(join(ROOT, w.module), 'utf8'), `${w.module} holds ${w.fn}`).toMatch(new RegExp(`function ${w.fn}\\b`));
    }
    // The modex deal writers that exist are all registered: any new exported writer of dealstage in deals.ts must be named.
    const deals = readFileSync(join(ROOT, 'src/lib/hubspot/deals.ts'), 'utf8');
    const exported = [...deals.matchAll(/export async function (\w+)/g)].map((m) => m[1]);
    const writers = exported.filter((fn) => {
      const body = deals.slice(deals.indexOf(`function ${fn}(`));
      const end = body.search(/\nexport (async )?function /);
      return /dealstage/.test(end > 0 ? body.slice(0, end) : body) && /basicApi\.(update|create)\(/.test(end > 0 ? body.slice(0, end) : body);
    });
    expect(writers.sort()).toEqual(STAGE_WRITERS.filter((w) => w.system === 'modex-gtm' && w.module === 'src/lib/hubspot/deals.ts').map((w) => w.fn).sort());
    expect(STAGE_WRITERS.filter((w) => w.kind === 'touch_automation').map((w) => `${w.system}:${w.fn}`)).toEqual(['modex-gtm:upsertDealForAccount', 'clawd-control-plane:update_deal_stage', 'clawd-control-plane:update_deal_stage', 'clawd-control-plane:auto_push_on_send']);
  });
});

describe('C51: the fixture sent_t1 never advances a commercial stage', () => {
  it('a first touch sent, a manual send, a reply answered, a meeting outcome, an obligation done and a HubSpot next step written are never deal_advanced', () => {
    const rows: LedgerRow[] = [
      row('execution.gmail_direct_sent', { recipient: 'dave.kiesling@kencogroup.com', stepIndex: 0, gmailSentMessageId: 'g-t1', accountName: 'Kenco Logistics' }),
      row('execution.gmail_manual_sent', { recipient: 'dave.kiesling@kencogroup.com', stepIndex: 1, gmailSentMessageId: 'g-t2' }),
      row('execution.reply_sent', { recipient: 'dave.kiesling@kencogroup.com', gmailSentMessageId: 'g-r' }, { subject_type: 'inbound_message', subject_id: 'm1' }),
      row('capture.meeting', { outcome: 'next_meeting', contactEmail: 'dave.kiesling@kencogroup.com', dealId: '62704698979' }),
      row(COMMITMENT_EVENT, { op: 'status', commitment: { commitmentId: 'c1', status: 'done', proof: { kind: 'seller', text: 'sent the deck' }, accountName: 'Kenco Logistics', title: 'Send the deck', dealId: '62704698979' } }, { subject_type: 'commitment', subject_id: 'c1' }),
      row('crm.sync_result', { outcome: 'written', dealId: '62704698979', change: { kind: 'deal_field', property: 'hs_next_step', to: 'Reconnect in October' }, accountName: 'Kenco Logistics' }, { subject_type: 'crm_sync', subject_id: 'p1' }),
    ];
    const events = rows.map(projectActivity).filter((e): e is NonNullable<typeof e> => !!e);
    expect(events.length).toBeGreaterThanOrEqual(5);
    expect(events.map((e) => e.kind)).not.toContain('deal_advanced');
    expect(events.filter((e) => e.kind === 'message_sent')).toHaveLength(3);
    expect(events.find((e) => e.kind === 'crm_updated')?.line).toMatch(/not a stage change/);
  });

  it('advancement has exactly one evidence shape: two CRM reads of the same deal that moved; the projection says HubSpot', () => {
    const before = dealStage(dealCoverageFrom(summary('complete', 'qualifiedtobuy')), { dealId: '62704698979' });
    const after = dealStage(dealCoverageFrom(summary('complete', 'presentationscheduled')), { dealId: '62704698979' });
    const payload = stageChangedFromCrm(before, after, { commitmentId: 'c9' });
    expect(payload).toEqual({ dealId: '62704698979', dealName: 'YardFlow - Kenco', accountName: 'Kenco Logistics', from: 'qualifiedtobuy', to: 'presentationscheduled', basis: 'provider', source: 'hubspot', checkedAt: '2026-10-08T14:55:00.000Z', previousCheckedAt: '2026-10-08T14:55:00.000Z', commitmentId: 'c9' });
    const ev = projectActivity(row(DEAL_STAGE_CHANGED, payload, { subject_type: 'deal', subject_id: '62704698979' }));
    expect(ev).toMatchObject({ kind: 'deal_advanced', basis: 'provider', dealId: '62704698979', evidence: '62704698979:presentationscheduled' });
    expect(ev?.line).toMatch(/\(HubSpot\)\.$/);
    expect(ev?.line).not.toMatch(/HubSpot not read/);
    // Not from an unread CRM, not across deals, not when nothing moved.
    expect(stageChangedFromCrm(dealStage(dealCoverageFrom(summary('unavailable')), { dealId: '62704698979' }), after)).toBeNull();
    expect(stageChangedFromCrm(before, before)).toBeNull();
    expect(stageChangedFromCrm(before, { ...after, dealId: 'other' } as typeof after)).toBeNull();
  });

  it('a stage is read from the CRM under a complete read, none only under a complete read, unknown otherwise, each said with its basis', () => {
    const complete = dealCoverageFrom(summary('complete'));
    expect(dealStage(complete, { accountName: 'Kenco' })).toMatchObject({ status: 'known', stage: 'presentationscheduled', basis: 'provider', dealId: '62704698979', checkedAt: '2026-10-08T14:55:00.000Z' });
    expect(stageWords(dealStage(complete, { accountName: 'kenco logistics' }))).toBe('YardFlow - Kenco is at presentationscheduled (HubSpot read Oct 8, 10:55 AM New York)');
    expect(dealStage(complete, { accountName: 'PepsiCo' })).toEqual({ status: 'none', checkedAt: '2026-10-08T14:55:00.000Z' });
    expect(stageWords(dealStage(complete, { accountName: 'PepsiCo' }))).toBe('no open deal (HubSpot read Oct 8, 10:55 AM New York)');
    expect(dealStage(complete, { dealId: '1' })).toEqual({ status: 'unknown', reason: 'deal_not_found' });
    expect(dealStage(dealCoverageFrom(summary('unavailable')), { accountName: 'Kenco' })).toEqual({ status: 'unknown', reason: 'crm_unavailable' });
    expect(stageWords(dealStage(dealCoverageFrom(null), { accountName: 'Kenco' }))).toBe('deal stage unknown: HubSpot not read');
  });
});
