import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hubspotSequenceAdapter } from '@/lib/gap/execution/hubspot-sequence-adapter';
import type { ExecutionIntent } from '@/lib/gap/execution/contract';

const NOW = new Date('2026-09-24T12:00:00.000Z');

function intent(overrides: Partial<ExecutionIntent> = {}): ExecutionIntent {
  return {
    engine: 'hubspot_sequence',
    personaId: 7,
    hypothesisId: 'H1',
    sequenceVersionId: 'v1',
    stepIndex: 0,
    compileIds: [],
    senderIdentity: 'casey@yardflow.ai',
    idempotencyKey: 'idem_1',
    actor: 'casey@freightroll.com',
    actorKind: 'human',
    mode: 'live',
    now: NOW,
    ...overrides,
  };
}

const INPUT = { sequenceId: 'seq_1', contactId: 'contact_1', senderEmail: 'casey@yardflow.ai', userId: '85093129' };

describe('hubspotSequenceAdapter', () => {
  let savedFlag: string | undefined;
  let savedToken: string | undefined;
  beforeEach(() => {
    savedFlag = process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED;
    savedToken = process.env.HUBSPOT_ACCESS_TOKEN;
    delete process.env.HUBSPOT_ACCESS_TOKEN;
  });
  afterEach(() => {
    if (savedFlag === undefined) delete process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED;
    else process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED = savedFlag;
    if (savedToken === undefined) delete process.env.HUBSPOT_ACCESS_TOKEN;
    else process.env.HUBSPOT_ACCESS_TOKEN = savedToken;
  });

  it('flag off (the default): refuses without ever calling fetchImpl -- provable, not just asserted', async () => {
    delete process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED;
    const fetchImpl = vi.fn();

    const receipt = await hubspotSequenceAdapter(intent(), INPUT, { fetchImpl });

    expect(receipt).toEqual({
      engine: 'hubspot_sequence',
      status: 'refused',
      engineId: null,
      createdAt: NOW,
      refusalReason: 'gap_hubspot_sequence_publish_disabled',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('flag on, no access token: refuses hubspot_access_token_missing without a network call', async () => {
    process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED = 'true';
    const fetchImpl = vi.fn();

    const receipt = await hubspotSequenceAdapter(intent(), INPUT, { fetchImpl, accessToken: undefined });

    expect(receipt.status).toBe('refused');
    expect(receipt.refusalReason).toBe('hubspot_access_token_missing');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('flag on: a 403 from HubSpot is the documented capability boundary, not a generic failure', async () => {
    process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED = 'true';
    const fetchImpl = vi.fn(async () => new Response('Forbidden', { status: 403 }));

    const receipt = await hubspotSequenceAdapter(intent(), INPUT, { fetchImpl, accessToken: 'tok' });

    expect(receipt).toEqual({
      engine: 'hubspot_sequence',
      status: 'refused',
      engineId: null,
      createdAt: NOW,
      refusalReason: 'hubspot_write_scope_unavailable',
    });
  });

  it('flag on: a successful enrollment returns a queued receipt naming the real HubSpot enrollment id', async () => {
    process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED = 'true';
    const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe('https://api.hubapi.com/automation/v4/sequences/enrollments');
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer tok');
      expect(JSON.parse(String(init?.body))).toEqual(INPUT);
      return new Response(JSON.stringify({ enrollmentId: 'hs_enr_1' }), { status: 200 });
    });

    const receipt = await hubspotSequenceAdapter(intent(), INPUT, { fetchImpl, accessToken: 'tok' });

    expect(receipt).toEqual({ engine: 'hubspot_sequence', status: 'queued', engineId: 'hs_enr_1', createdAt: NOW });
  });

  it('flag on: a network throw is translated to a refused receipt, never rethrown', async () => {
    process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED = 'true';
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNRESET');
    });

    const receipt = await hubspotSequenceAdapter(intent(), INPUT, { fetchImpl, accessToken: 'tok' });

    expect(receipt.status).toBe('refused');
    expect(receipt.refusalReason).toContain('ECONNRESET');
  });
});
