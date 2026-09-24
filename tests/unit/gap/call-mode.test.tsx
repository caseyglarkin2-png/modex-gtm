/**
 * Call mode client (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * SHOULD FIX (Opus adversarial review, 2026-09-24): before this fix,
 * `sourceId` was only regenerated on `onCleared` (Escape / an explicit
 * reset), never on a successful `onSubmitted`. A one-tap call disposition
 * followed by a second, genuine one-tap on the same persona reused the
 * stale id and collided with the first on the unique (source_kind,
 * source_id), reading back as a 409 -- exactly the failure this file's own
 * module doc already promised was handled ("a new id is issued after every
 * recorded disposition"), but the code never did it.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CallMode } from '@/app/gap/call/[personaId]/call-mode';
import type { ApiResult, CallBrief, DispositionResult, GapApiClient } from '@/lib/gap/ui/gap-api-client';

const BRIEF: CallBrief = {
  persona: { id: 7, personaKey: 'site_ops', name: 'Jordan Lee', title: 'VP Ops', email: 'jordan@acme.example', phone: '+15555550100', role: null, doNotContact: false },
  account: { name: 'Acme Foods', hubspotCompanyId: '111', tier: 'A', vertical: null },
  hypothesis: {
    id: 'H1',
    status: 'active',
    problemFamily: 'hidden_capacity',
    confidence: 60,
    observation: 'They opened a second DC.',
    signals: [],
    problemHypothesis: 'Gate waiting caps turns.',
    rootCauseHypotheses: [],
    impactHypotheses: [],
    whyNow: null,
    falsificationQuestions: [],
    whatANoMeans: null,
    contraryEvidence: null,
  },
  lastDispositions: [],
  openBids: [],
  suggestedQuestions: [],
};

const RESULT: DispositionResult = {
  dispositionId: 'disp_1',
  bidIds: [],
  effects: { stopped: [], unsubscribed: false, resolution: null, mirrored: false },
  refusals: [],
};

function clientWith(postDisposition: ReturnType<typeof vi.fn>): GapApiClient {
  return {
    listReplies: vi.fn(),
    getCallBrief: vi.fn(async (): Promise<ApiResult<CallBrief>> => ({ ok: true, status: 200, data: BRIEF })),
    postDisposition,
    postBid: vi.fn(),
    suggestReply: vi.fn(),
    getLearningReport: vi.fn(),
    getRoutingAgreement: vi.fn(),
  } as unknown as GapApiClient;
}

describe('CallMode', () => {
  it('SHOULD FIX: two consecutive one-tap dispositions carry DIFFERENT source ids, so the second never 409s on the first', async () => {
    const postDisposition = vi.fn(async (): Promise<ApiResult<DispositionResult>> => ({ ok: true, status: 201, data: RESULT }));
    const client = clientWith(postDisposition);
    render(<CallMode personaId="7" client={client} />);

    fireEvent.click(await screen.findByTestId('call-tap-no_answer'));
    await waitFor(() => expect(postDisposition).toHaveBeenCalledTimes(1));

    // The form remounts (key={sourceId}) back to the first row for a second call.
    fireEvent.click(await screen.findByTestId('call-tap-voicemail'));
    await waitFor(() => expect(postDisposition).toHaveBeenCalledTimes(2));

    const firstSourceId = postDisposition.mock.calls[0][0].source.id;
    const secondSourceId = postDisposition.mock.calls[1][0].source.id;
    expect(firstSourceId).toEqual(expect.stringMatching(/^call:7:/));
    expect(secondSourceId).toEqual(expect.stringMatching(/^call:7:/));
    expect(secondSourceId).not.toBe(firstSourceId);
  });

  it('control: a single tap posts once with the persona-scoped source id', async () => {
    const postDisposition = vi.fn(async (): Promise<ApiResult<DispositionResult>> => ({ ok: true, status: 201, data: RESULT }));
    const client = clientWith(postDisposition);
    render(<CallMode personaId="7" client={client} />);

    fireEvent.click(await screen.findByTestId('call-tap-gatekeeper'));
    await waitFor(() => expect(postDisposition).toHaveBeenCalledTimes(1));
    expect(postDisposition.mock.calls[0][0]).toMatchObject({ responseClass: 'gatekeeper', channel: 'call' });
  });
});
