/**
 * Disposition form (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * Pins: call mode's first row (keys 1 to 4, three one-tap classes), the
 * fifteen conversation classes as chips, call-only classes absent from the
 * reply form, root cause and impact chips only with a problem_* class, the
 * client-side quote rule for problem_confirmed, the EXACT contract body for
 * (a) a voicemail one-tap and (b) an email problem_confirmed with one
 * business_problem BID and a root cause, the server 409 reason and 400
 * field verbatim, the effects panel and the one-interaction clear, the
 * keyboard (Enter, Esc, letter keys), the AI suggestion chip label with no
 * pre-selection, and the structural guard that no component source reaches
 * for private fields.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RESPONSE_CLASSES } from '@/lib/gap/taxonomy';
import type { ApiResult, DispositionBody, DispositionResult, GapApiClient, ReplySuggestion } from '@/lib/gap/ui/gap-api-client';
import {
  AI_SUGGESTION_LABEL,
  CALL_FIRST_ROW,
  CALL_ONLY_CLASSES,
  CLASS_KEYS,
  CONVERSATION_CLASSES,
  DispositionForm,
  REFUSAL_TEXT,
  buildDispositionBody,
  chipOptions,
  emptyDraft,
  validateDraft,
  type DispositionPrefill,
} from '@/components/gap/disposition-form';

const CREATED: DispositionResult = {
  dispositionId: 'disp_1',
  bidIds: ['bid_1'],
  effects: { stopped: ['enr_1', 'enr_2'], unsubscribed: false, resolution: { outcome: 'confirmed', confidence: 85 }, mirrored: true },
  refusals: [],
};

function clientWith(answer: ApiResult<DispositionResult>) {
  const postDisposition = vi.fn<GapApiClient['postDisposition']>(async () => answer);
  const client: GapApiClient = {
    postDisposition,
    listReplies: vi.fn(),
    getCallBrief: vi.fn(),
    postBid: vi.fn(),
    suggestReply: vi.fn(),
  };
  return { client, postDisposition };
}

const CALL_PREFILL: DispositionPrefill = {
  hypothesisId: 'hyp_1',
  personaId: 41,
  contactEmail: 'Jordan@Acme.example',
  channel: 'call',
  source: { kind: 'call', id: 'call:41:1' },
  problemFamily: 'hidden_capacity',
};

const EMAIL_PREFILL: DispositionPrefill = {
  hypothesisId: 'hyp_1',
  personaId: 41,
  contactEmail: 'jordan@acme.example',
  channel: 'email',
  source: { kind: 'inbound_message', id: 'gm_18f2' },
  problemFamily: 'hidden_capacity',
};

const SUGGESTION: ReplySuggestion = {
  id: 'disp_ai_1',
  responseClass: 'problem_confirmed',
  bids: [{ type: 'business_problem', quote: 'Trucks sit at the gate for an hour.', why: 'names the problem' }],
  why: 'The reply agrees with the hypothesis.',
};

function posted(postDisposition: ReturnType<typeof clientWith>['postDisposition']): DispositionBody {
  expect(postDisposition).toHaveBeenCalledTimes(1);
  return postDisposition.mock.calls[0][0];
}

describe('rules', () => {
  it('splits the eighteen classes into three call-only and fifteen conversation classes, keyed a to o', () => {
    expect(CALL_ONLY_CLASSES).toEqual(['no_answer', 'voicemail', 'gatekeeper']);
    expect(CONVERSATION_CLASSES).toHaveLength(15);
    expect([...CONVERSATION_CLASSES, ...CALL_ONLY_CLASSES].sort()).toEqual([...RESPONSE_CLASSES].sort());
    expect([...CLASS_KEYS.values()]).toEqual('abcdefghijklmno'.split(''));
    expect(CALL_FIRST_ROW.map((row) => [row.key, row.responseClass])).toEqual([
      ['1', 'no_answer'],
      ['2', 'voicemail'],
      ['3', 'gatekeeper'],
      ['4', null],
    ]);
  });

  it('validateDraft mirrors the model: class required, call-only on call, quote on confirmations, root cause with a problem class, objection on existing_solution', () => {
    expect(validateDraft(emptyDraft(), 'email')).toEqual({ field: 'responseClass', reason: 'class_required' });
    expect(validateDraft({ ...emptyDraft(), responseClass: 'voicemail' }, 'email')).toEqual({ field: 'responseClass', reason: 'call_only_class' });
    expect(validateDraft({ ...emptyDraft(), responseClass: 'voicemail' }, 'call')).toBeNull();
    expect(validateDraft({ ...emptyDraft(), responseClass: 'problem_confirmed' }, 'email')).toEqual({ field: 'buyerLanguage', reason: 'quote_required' });
    expect(validateDraft({ ...emptyDraft(), responseClass: 'problem_partially_confirmed', buyerLanguage: ' ' }, 'call')).toEqual({ field: 'buyerLanguage', reason: 'quote_required' });
    expect(validateDraft({ ...emptyDraft(), responseClass: 'timing', rootCauseClass: 'Gate waiting' }, 'email')).toEqual({ field: 'rootCauseClass', reason: 'requires_problem_class' });
    expect(validateDraft({ ...emptyDraft(), responseClass: 'timing', impactClass: 'Overtime' }, 'email')).toEqual({ field: 'impactClass', reason: 'requires_problem_class' });
    expect(validateDraft({ ...emptyDraft(), responseClass: 'problem_rejected', rootCauseClass: 'Gate waiting' }, 'email')).toBeNull();
    expect(validateDraft({ ...emptyDraft(), responseClass: 'existing_solution' }, 'email')).toEqual({ field: 'objection', reason: 'objection_required' });
    expect(validateDraft({ ...emptyDraft(), responseClass: 'existing_solution', objection: 'Runs a YMS' }, 'email')).toBeNull();
  });

  it('chipOptions narrows to one family and falls back to the union', () => {
    expect(chipOptions('hidden_capacity').causes).toContain('Gate waiting');
    expect(chipOptions('hidden_capacity').causes).not.toContain('Paperwork');
    expect(chipOptions(null).causes).toContain('Paperwork');
    expect(chipOptions('not_a_family').impacts).toContain('Claims');
  });

  it('buildDispositionBody lowercases the email and omits every empty optional', () => {
    expect(buildDispositionBody(CALL_PREFILL, { ...emptyDraft(), responseClass: 'no_answer' })).toEqual({
      hypothesisId: 'hyp_1',
      personaId: 41,
      contactEmail: 'jordan@acme.example',
      channel: 'call',
      responseClass: 'no_answer',
      source: { kind: 'call', id: 'call:41:1' },
    });
    expect(buildDispositionBody({ ...EMAIL_PREFILL, personaId: null }, { ...emptyDraft(), responseClass: 'timing' })).not.toHaveProperty('personaId');
  });
});

describe('<DispositionForm mode="call">', () => {
  it('renders the first row of four with keys 1 to 4 and no class chips yet', () => {
    const { client } = clientWith({ ok: true, status: 201, data: CREATED });
    render(<DispositionForm mode="call" prefill={CALL_PREFILL} client={client} />);
    const row = screen.getByTestId('call-first-row');
    expect(within(row).getAllByRole('button')).toHaveLength(4);
    for (const entry of CALL_FIRST_ROW) {
      const button = screen.getByTestId(`call-tap-${entry.responseClass ?? 'conversation'}`);
      expect(button).toHaveTextContent(entry.label);
      expect(within(button).getByText(entry.key)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('class-chip-problem_confirmed')).toBeNull();
    expect(screen.queryByTestId('bid-chips')).toBeNull();
  });

  it('(a) voicemail one-tap posts EXACTLY the contract body: channel call, the class, no BID', async () => {
    const { client, postDisposition } = clientWith({ ok: true, status: 201, data: { ...CREATED, bidIds: [], effects: { stopped: [], unsubscribed: false, resolution: null, mirrored: false } } });
    render(<DispositionForm mode="call" prefill={CALL_PREFILL} client={client} />);
    fireEvent.click(screen.getByTestId('call-tap-voicemail'));
    await screen.findByTestId('disposition-effects');
    expect(posted(postDisposition)).toEqual({
      hypothesisId: 'hyp_1',
      personaId: 41,
      contactEmail: 'jordan@acme.example',
      channel: 'call',
      responseClass: 'voicemail',
      source: { kind: 'call', id: 'call:41:1' },
    });
    expect(screen.getByTestId('effect-stopped')).toHaveTextContent('Stopped 0 enrollments');
    expect(screen.getByTestId('effect-resolution')).toHaveTextContent('Resolution: none');
  });

  it('key 2 fires the voicemail one-tap from the keyboard', async () => {
    const { client, postDisposition } = clientWith({ ok: true, status: 201, data: CREATED });
    render(<DispositionForm mode="call" prefill={CALL_PREFILL} client={client} />);
    fireEvent.keyDown(screen.getByTestId('disposition-form'), { key: '2' });
    await screen.findByTestId('disposition-effects');
    expect(posted(postDisposition).responseClass).toBe('voicemail');
  });

  it('conversation (key 4) reveals every conversation class as a chip and none of the call-only ones', () => {
    const { client } = clientWith({ ok: true, status: 201, data: CREATED });
    render(<DispositionForm mode="call" prefill={CALL_PREFILL} client={client} />);
    fireEvent.keyDown(screen.getByTestId('disposition-form'), { key: '4' });
    expect(screen.queryByTestId('call-first-row')).toBeNull();
    for (const cls of CONVERSATION_CLASSES) {
      const chip = screen.getByTestId(`class-chip-${cls}`);
      expect(chip).toHaveAttribute('aria-pressed', 'false');
      expect(within(chip).getByText(CLASS_KEYS.get(cls) as string)).toBeInTheDocument();
    }
    for (const cls of CALL_ONLY_CLASSES) expect(screen.queryByTestId(`class-chip-${cls}`)).toBeNull();
    expect(screen.getByTestId('bid-chips')).toBeInTheDocument();
  });

  it('root cause and impact chips appear only once a problem_* class is chosen, and a letter key picks a class', () => {
    const { client } = clientWith({ ok: true, status: 201, data: CREATED });
    render(<DispositionForm mode="call" prefill={CALL_PREFILL} client={client} />);
    fireEvent.click(screen.getByTestId('call-tap-conversation'));
    expect(screen.queryByTestId('root-cause-chip-Gate waiting')).toBeNull();

    fireEvent.keyDown(screen.getByTestId('disposition-form'), { key: 'a' });
    expect(screen.getByTestId('class-chip-problem_confirmed')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('root-cause-chip-Gate waiting')).toBeInTheDocument();
    expect(screen.getByTestId('impact-chip-Overtime')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('class-chip-timing'));
    expect(screen.getByTestId('class-chip-timing')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('class-chip-problem_confirmed')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByTestId('root-cause-chip-Gate waiting')).toBeNull();
  });
});

describe('<DispositionForm mode="reply">', () => {
  it('starts on the class chips; call-only classes are absent', () => {
    const { client } = clientWith({ ok: true, status: 201, data: CREATED });
    render(<DispositionForm mode="reply" prefill={EMAIL_PREFILL} client={client} />);
    expect(screen.queryByTestId('call-first-row')).toBeNull();
    expect(screen.getAllByTestId(/^class-chip-/)).toHaveLength(15);
    for (const cls of CALL_ONLY_CLASSES) expect(screen.queryByTestId(`class-chip-${cls}`)).toBeNull();
    expect(screen.getByTestId('disposition-form')).toHaveAttribute('data-channel', 'email');
  });

  it('problem_confirmed without the buyer language is refused client-side with the named message and nothing is posted', () => {
    const { client, postDisposition } = clientWith({ ok: true, status: 201, data: CREATED });
    render(<DispositionForm mode="reply" prefill={EMAIL_PREFILL} client={client} />);
    fireEvent.click(screen.getByTestId('class-chip-problem_confirmed'));
    const submit = screen.getByTestId('disposition-submit');
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('title', REFUSAL_TEXT.quote_required);
    fireEvent.keyDown(screen.getByTestId('disposition-form'), { key: 'Enter' });
    expect(screen.getByTestId('client-error')).toHaveTextContent(REFUSAL_TEXT.quote_required);
    expect(screen.getByTestId('client-error')).toHaveAttribute('data-field', 'buyerLanguage');
    expect(postDisposition).not.toHaveBeenCalled();
  });

  it('(b) email problem_confirmed with one business_problem BID and a root cause posts EXACTLY the contract body, then shows the effects', async () => {
    const { client, postDisposition } = clientWith({ ok: true, status: 201, data: CREATED });
    const onSubmitted = vi.fn();
    render(<DispositionForm mode="reply" prefill={EMAIL_PREFILL} client={client} onSubmitted={onSubmitted} />);
    fireEvent.click(screen.getByTestId('class-chip-problem_confirmed'));
    fireEvent.click(screen.getByTestId('root-cause-chip-Gate waiting'));
    fireEvent.change(screen.getByLabelText('Buyer language'), { target: { value: ' Trucks sit at the gate for an hour every morning. ' } });
    fireEvent.click(screen.getByTestId('bid-chip-business_problem'));
    fireEvent.change(screen.getByLabelText('Quote'), { target: { value: 'Trucks sit at the gate for an hour every morning.' } });
    fireEvent.click(screen.getByTestId('bid-add'));
    expect(screen.getAllByTestId('bid-added')).toHaveLength(1);

    fireEvent.keyDown(screen.getByTestId('disposition-form'), { key: 'Enter' });
    await screen.findByTestId('disposition-effects');

    expect(posted(postDisposition)).toEqual({
      hypothesisId: 'hyp_1',
      personaId: 41,
      contactEmail: 'jordan@acme.example',
      channel: 'email',
      responseClass: 'problem_confirmed',
      rootCauseClass: 'Gate waiting',
      buyerLanguage: 'Trucks sit at the gate for an hour every morning.',
      source: { kind: 'inbound_message', id: 'gm_18f2' },
      bids: [{ type: 'business_problem', rawBuyerLanguage: 'Trucks sit at the gate for an hour every morning.' }],
    });
    expect(onSubmitted).toHaveBeenCalledWith(CREATED);
    expect(screen.getByTestId('effect-stopped')).toHaveTextContent('Stopped 2 enrollments');
    expect(screen.getByTestId('effect-unsubscribed')).toHaveTextContent('Unsubscribed: no');
    expect(screen.getByTestId('effect-resolution')).toHaveTextContent('Resolution: confirmed, confidence 85%');
    expect(screen.getByTestId('effect-mirrored')).toHaveTextContent('Mirrored to HubSpot: yes');

    // One interaction clears: Done returns an empty form.
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByTestId('disposition-effects')).toBeNull();
    expect(screen.getByTestId('class-chip-problem_confirmed')).toHaveAttribute('aria-pressed', 'false');
    expect((screen.getByLabelText('Buyer language') as HTMLTextAreaElement).value).toBe('');
  });

  it('shows a server 409 reason verbatim and keeps the draft', async () => {
    const { client } = clientWith({ ok: false, status: 409, error: 'hypothesis_not_active' });
    render(<DispositionForm mode="reply" prefill={EMAIL_PREFILL} client={client} />);
    fireEvent.click(screen.getByTestId('class-chip-timing'));
    fireEvent.click(screen.getByTestId('disposition-submit'));
    const alert = await screen.findByTestId('server-error');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert.textContent).toBe('hypothesis_not_active');
    expect(screen.getByTestId('class-chip-timing')).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a server 400 with the refused field', async () => {
    const { client } = clientWith({ ok: false, status: 400, error: 'invalid_body', field: 'contactEmail' });
    render(<DispositionForm mode="reply" prefill={EMAIL_PREFILL} client={client} />);
    fireEvent.click(screen.getByTestId('class-chip-timing'));
    fireEvent.click(screen.getByTestId('disposition-submit'));
    expect(await screen.findByTestId('server-error')).toHaveTextContent('invalid_body: contactEmail');
  });

  it('Escape clears the draft and reports it', () => {
    const { client } = clientWith({ ok: true, status: 201, data: CREATED });
    const onCleared = vi.fn();
    render(<DispositionForm mode="reply" prefill={EMAIL_PREFILL} client={client} onCleared={onCleared} />);
    fireEvent.click(screen.getByTestId('class-chip-timing'));
    fireEvent.change(screen.getByLabelText('Next best action'), { target: { value: 'Call in March' } });
    fireEvent.keyDown(screen.getByTestId('disposition-form'), { key: 'Escape' });
    expect(screen.getByTestId('class-chip-timing')).toHaveAttribute('aria-pressed', 'false');
    expect((screen.getByLabelText('Next best action') as HTMLInputElement).value).toBe('');
    expect(onCleared).toHaveBeenCalledTimes(1);
  });

  it('existing_solution reveals the objection field and requires it', () => {
    const { client } = clientWith({ ok: true, status: 201, data: CREATED });
    render(<DispositionForm mode="reply" prefill={EMAIL_PREFILL} client={client} />);
    expect(screen.queryByLabelText('Objection')).toBeNull();
    fireEvent.click(screen.getByTestId('class-chip-existing_solution'));
    expect(screen.getByTestId('disposition-submit')).toHaveAttribute('title', REFUSAL_TEXT.objection_required);
    fireEvent.change(screen.getByLabelText('Objection'), { target: { value: 'Runs a YMS' } });
    expect(screen.getByTestId('disposition-submit')).toBeEnabled();
  });

  it('Enter inside a textarea does not submit; Ctrl plus Enter does', async () => {
    const { client, postDisposition } = clientWith({ ok: true, status: 201, data: CREATED });
    render(<DispositionForm mode="reply" prefill={EMAIL_PREFILL} client={client} />);
    fireEvent.click(screen.getByTestId('class-chip-timing'));
    const textarea = screen.getByLabelText('Buyer language');
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(postDisposition).not.toHaveBeenCalled();
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    await waitFor(() => expect(postDisposition).toHaveBeenCalledTimes(1));
  });
});

describe('AI suggestion', () => {
  it('renders the chip labelled "suggested, not confirmed" and pre-selects NOTHING', () => {
    const { client } = clientWith({ ok: true, status: 201, data: CREATED });
    render(<DispositionForm mode="reply" prefill={EMAIL_PREFILL} client={client} suggestion={SUGGESTION} />);
    expect(AI_SUGGESTION_LABEL).toBe('suggested, not confirmed');
    const chip = screen.getByTestId('ai-suggestion');
    expect(chip).toHaveTextContent('suggested, not confirmed: problem confirmed');
    for (const cls of CONVERSATION_CLASSES) {
      expect(screen.getByTestId(`class-chip-${cls}`)).toHaveAttribute('aria-pressed', 'false');
    }
    expect(screen.getByTestId('disposition-submit')).toBeDisabled();
    expect(screen.getByTestId('suggested-bids')).toHaveTextContent('Trucks sit at the gate for an hour.');
    expect(screen.queryByTestId('bid-added')).toBeNull();
  });

  it('a human click on "Use suggestion" selects the class; a suggested quote seeds a BID panel but adds nothing by itself', () => {
    const { client } = clientWith({ ok: true, status: 201, data: CREATED });
    render(<DispositionForm mode="reply" prefill={EMAIL_PREFILL} client={client} suggestion={SUGGESTION} />);
    fireEvent.click(screen.getByRole('button', { name: 'Use suggestion' }));
    expect(screen.getByTestId('class-chip-problem_confirmed')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(screen.getByTestId('suggested-bids')).getByRole('button', { name: 'use' }));
    expect(screen.getByTestId('bid-panel')).toHaveAttribute('data-bid-type', 'business_problem');
    expect(screen.queryByTestId('bid-added')).toBeNull();
  });

  it('carries the suggestion id on the body only when the prefill names one', async () => {
    const { client, postDisposition } = clientWith({ ok: true, status: 201, data: CREATED });
    render(<DispositionForm mode="reply" prefill={{ ...EMAIL_PREFILL, aiSuggestionId: 'sug_9' }} client={client} suggestion={SUGGESTION} />);
    fireEvent.click(screen.getByTestId('class-chip-timing'));
    fireEvent.click(screen.getByTestId('disposition-submit'));
    await screen.findByTestId('disposition-effects');
    expect(posted(postDisposition).aiSuggestionId).toBe('sug_9');
  });
});

describe('structural: the components read only contract fields', () => {
  const FORBIDDEN = ['intent', 'inputs_snapshot', 'microsite', '/demo/'];
  const SOURCES = ['reply-list.tsx', 'disposition-form.tsx', 'bid-chips.tsx', 'pre-call-brief.tsx'];

  it.each(SOURCES)('%s never mentions a private field', (file) => {
    const source = readFileSync(path.resolve(process.cwd(), 'src/components/gap', file), 'utf8').toLowerCase();
    for (const token of FORBIDDEN) {
      expect(source, `${file} contains "${token}"`).not.toContain(token);
    }
  });
});
