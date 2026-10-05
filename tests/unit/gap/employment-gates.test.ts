/**
 * THE DECISION-TIME EMPLOYMENT GATE (owner resolution, 2026-10-05). A departed or conflicted person fails closed at
 * every seam GAP relies on them: routing inputs (never a card), the draft / send / copy prepare, a cold call or
 * LinkedIn touch, and enrollment. Each refusal carries its own reason, never 'suppressed' or do-not-contact; a person
 * who left is still a person (nothing here writes suppression).
 */
import { describe, expect, it, vi } from 'vitest';
import { employmentGate } from '@/lib/gap/people/employment-gate';
import { assembleRoutingInputs } from '@/lib/gap/routing/inputs';
import { checkColdOutbound } from '@/lib/gap/execution/cold-outbound';
import { createSellerGmailDraft } from '@/lib/gap/execution/seller-draft';
import { NOW, db, prismaOf, baseDeps, gmailFake } from './fixtures/seller-db';

const LEFT = (pid: number) => ({ persona_id: pid, fields: [{ field_name: 'employment_status', field_value: 'left', source: 'manual', source_timestamp: NOW, confidence: 1, last_writer: 'casey' }, { field_name: 'employment_company', field_value: 'ADUSA Distribution', source: 'manual', source_timestamp: NOW, confidence: 1, last_writer: 'casey' }] });
const CONFLICT = (pid: number) => ({ persona_id: pid, fields: [{ field_name: 'company_name', field_value: 'Other Co', source: 'apollo', source_timestamp: new Date('2026-09-11T00:00:00Z'), confidence: null, last_writer: 'apollo_intake' }] });

describe('employmentGate', () => {
  const prisma = (rows: any[], enrich: any[]) => ({ persona: { findMany: vi.fn(async () => rows) }, contactEnrichment: { findMany: vi.fn(async () => enrich) }, conversationDisposition: { findMany: vi.fn(async () => []) } });
  const dakota = { id: 1306, account_name: 'H-E-B', title: 'transportation & reverse logistics', email: 'socha.dakota@heb.com', hubspot_contact_id: '218964806213' };
  it('left: persona_left_account with the human reason; conflict: persona_employment_conflict; unverified: null; no persona: null', async () => {
    expect(await employmentGate(prisma([dakota], [LEFT(1306)]), 1306, NOW)).toMatchObject({ reason: 'persona_left_account', state: 'LEFT_COMPANY_CONFIRMED' });
    expect(await employmentGate(prisma([dakota], [CONFLICT(1306)]), 1306, NOW)).toMatchObject({ reason: 'persona_employment_conflict', state: 'EMPLOYMENT_CONFLICT' });
    expect(await employmentGate(prisma([dakota], []), 1306, NOW)).toBeNull();
    expect(await employmentGate(prisma([], []), null, NOW)).toBeNull();
    expect(await employmentGate({}, 1306, NOW)).toBeNull();
  });
});

describe('routing inputs: a departed person is skipped by reason before any other read', () => {
  it('skips persona_left_account and never reaches the triggers or the suppression read', async () => {
    const read = vi.fn();
    const prisma = {
      account: { findUnique: vi.fn(async () => ({ name: 'H-E-B', hubspot_company_id: null, outreach_status: null })) },
      persona: { findUnique: vi.fn(async () => ({ id: 1306, account_name: 'H-E-B', title: 't', seniority: 'director', function: null, persona_lane: null, email: 'socha.dakota@heb.com', email_valid: true, email_status: null, phone: null, phone_status: null, linkedin_url: null, hubspot_contact_id: null, do_not_contact: false })), findMany: vi.fn(async () => [{ id: 1306, account_name: 'H-E-B', title: 't', email: 'socha.dakota@heb.com', hubspot_contact_id: null }]) },
      contactEnrichment: { findMany: vi.fn(async () => [LEFT(1306)]) },
      conversationDisposition: { findMany: vi.fn(async () => []) },
      pounceTrigger: { findMany: vi.fn(async () => { throw new Error('must not be read'); }) },
    };
    const r = await assembleRoutingInputs(prisma as any, { accountName: 'H-E-B', personaId: 1306, now: NOW, suppression: { read } });
    expect(r).toEqual({ skip: 'persona_left_account' });
    expect(read).not.toHaveBeenCalled();
    expect(prisma.pounceTrigger.findMany).not.toHaveBeenCalled();
  });
});

describe('the draft / send prepare refuses a departed or conflicted person, after do-not-contact, before Gmail', () => {
  it('a Casey correction on the card\'s person refuses persona_left_account with the reason; nothing drafted', async () => {
    const d = db();
    const prisma = prismaOf(d) as any;
    prisma.contactEnrichment = { findMany: vi.fn(async () => [LEFT(1886)]) };
    const gmail = gmailFake();
    const r = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d, 'pass', gmail));
    expect(r).toMatchObject({ ok: false, reason: 'persona_left_account' });
    expect(!r.ok && r.detail).toMatch(/Casey marked them as no longer at Kroger/);
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
    // Never do-not-contact: the persona row is untouched.
    expect(d.personas[0].do_not_contact).toBeFalsy();
  });
  it('a provider conflict refuses persona_employment_conflict; a clean person still drafts', async () => {
    const d = db();
    const prisma = prismaOf(d) as any;
    prisma.contactEnrichment = { findMany: vi.fn(async () => [CONFLICT(1886)]) };
    expect(await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d, 'pass', gmailFake()))).toMatchObject({ ok: false, reason: 'persona_employment_conflict' });
    const clean = db();
    const p2 = prismaOf(clean) as any;
    p2.contactEnrichment = { findMany: vi.fn(async () => []) };
    expect((await createSellerGmailDraft(p2, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(clean, 'pass', gmailFake()))).ok).toBe(true);
  });
});

describe('a cold call or LinkedIn touch refuses a departed person with seller words', () => {
  it('persona_left_account names the account and the next step', async () => {
    const prisma = {
      routingDecision: { findUnique: vi.fn(async () => ({ account_name: 'H-E-B', persona_id: 1306, hypothesis_id: null, action: 'call_now', lane: 'work_queue', created_at: NOW })), findFirst: vi.fn(async () => null) },
      persona: { findUnique: vi.fn(async () => ({ email: 'socha.dakota@heb.com', phone: '+12109385467', linkedin_url: null, do_not_contact: false })), findMany: vi.fn(async () => [{ id: 1306, account_name: 'H-E-B', title: 't', email: 'socha.dakota@heb.com', hubspot_contact_id: null }]) },
      contactEnrichment: { findMany: vi.fn(async () => [LEFT(1306)]) },
      conversationDisposition: { findMany: vi.fn(async () => []), findFirst: vi.fn(async () => null) },
    };
    const r = await checkColdOutbound(prisma as any, { decisionId: 'd', channel: 'call', now: NOW }, { opportunity: vi.fn(async () => ({ status: 'CLEAR' })) } as any);
    expect(r).toMatchObject({ ok: false, reason: 'persona_left_account' });
    expect(!r.ok && r.message).toMatch(/no longer at H-E-B: a historical contact\. Choose the current operator instead\./);
  });
});
