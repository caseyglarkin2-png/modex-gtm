/**
 * Decision card UI (GAP Prospecting OS, Sprint 2, S2-T11).
 *
 * Pins the six explain labels and their texts, the action chip, the blocked
 * badge, the three target chip labels, the "No hypothesis" case, the acted
 * state, the onAct wiring, plain-text rendering of explain fields, and the
 * private-intent leak guard (the fixture is clean and the card never reads
 * `intentScore` off a wider object).
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { DecisionCard, EXPLAIN_LABELS, TARGET_LABEL, type QueueItem } from '@/components/gap/decision-card';
import { FORBIDDEN_EXPLAIN_PATTERNS } from '@/lib/gap/routing/explain';

const EXPLAIN = {
  whyAccount: 'Acme Foods is in TAM (tier A, heat tier 2) and opened a second DC in Reno.',
  whyPerson: 'Jordan Reyes is the VP of Operations, the role that owns yards.',
  whyProblem: 'Hidden capacity: dock hours lost to gate congestion across its yards.',
  whyNow: 'The Reno ramp doubles inbound volume this quarter.',
  whyAction: 'A fresh trigger and a valid phone number put this in call now.',
  evidenceIds: ['ev_1', 'ev_2'],
  signalIds: ['sig_1'],
  wouldProveWrong: 'Reno runs its own gate with no dwell problem.',
};

function item(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: 'dec_1',
    action: 'call_now',
    lane: 'work_queue',
    ruleId: 'R7',
    priority: 92,
    blocked: false,
    target: null,
    explain: { ...EXPLAIN },
    account: { name: 'Acme Foods', hubspotCompanyId: '123', tam: 'in', tamTier: 'A', heatTier: 2 },
    persona: { id: 41, personaKey: 'vp_operations', displayName: 'Jordan Reyes', email: 'jordan@acme.example', hubspotContactId: '900' },
    hypothesis: { id: 'hyp_1', status: 'approved', family: 'hidden_capacity', confidence: 62 },
    humanAction: null,
    humanActionAt: null,
    createdAt: '2026-09-23T12:00:00.000Z',
    ...overrides,
  };
}

describe('<DecisionCard>', () => {
  it('renders all six explain labels with their texts from the fixture', () => {
    render(<DecisionCard item={item()} onAct={() => {}} />);
    const explain = screen.getByTestId('explain');
    expect(EXPLAIN_LABELS.map((entry) => entry.label)).toEqual([
      'Why this account',
      'Why this person',
      'Why this problem',
      'Why now',
      'Why this action',
      'Would prove us wrong',
    ]);
    for (const { key, label } of EXPLAIN_LABELS) {
      const term = within(explain).getByText(label, { selector: 'dt' });
      const definition = term.nextElementSibling;
      expect(definition?.tagName).toBe('DD');
      expect(definition).toHaveTextContent(EXPLAIN[key] as string);
    }
  });

  it('renders the action chip, rule id, priority, lane and counts', () => {
    render(<DecisionCard item={item()} onAct={() => {}} />);
    expect(screen.getByTestId('action-chip')).toHaveTextContent('call now');
    expect(screen.getByTestId('decision-card')).toHaveAttribute('data-action', 'call_now');
    expect(screen.getByText('R7')).toBeInTheDocument();
    expect(screen.getByText('priority 92')).toBeInTheDocument();
    expect(screen.getByText('work queue')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-counts')).toHaveTextContent('2 evidence, 1 signals');
  });

  it('renders the account, persona and hypothesis lines', () => {
    render(<DecisionCard item={item()} onAct={() => {}} />);
    expect(screen.getByTestId('account-line')).toHaveTextContent('Acme Foods');
    expect(screen.getByTestId('account-line')).toHaveTextContent('TAM in, tier A, heat tier 2');
    expect(screen.getByTestId('persona-line')).toHaveTextContent('Jordan Reyes');
    expect(screen.getByTestId('persona-line')).toHaveTextContent('vp operations');
    const hypothesis = screen.getByTestId('hypothesis-line');
    expect(hypothesis).toHaveTextContent('hidden capacity');
    expect(hypothesis).toHaveTextContent('approved');
    expect(hypothesis).toHaveTextContent('confidence 62%');
  });

  it('falls back to the email when the persona has no display name', () => {
    render(<DecisionCard item={item({ persona: { id: 41, personaKey: 'vp_operations', displayName: null, email: 'jordan@acme.example', hubspotContactId: null } })} onAct={() => {}} />);
    expect(screen.getByTestId('persona-line')).toHaveTextContent('jordan@acme.example');
  });

  it('shows the blocked badge only when blocked', () => {
    const { rerender } = render(<DecisionCard item={item({ blocked: true, lane: 'blocked', action: 'do_not_contact' })} onAct={() => {}} />);
    expect(screen.getByText('blocked', { selector: '[class*="destructive"]' })).toBeInTheDocument();
    rerender(<DecisionCard item={item()} onAct={() => {}} />);
    expect(screen.queryByText('blocked', { selector: '[class*="destructive"]' })).not.toBeInTheDocument();
  });

  it.each([
    ['hubspot_native', 'Rig-built sequence exists'],
    ['build_required', 'Sequence not built'],
    ['modex_queue', 'Secondary lane'],
  ] as const)('renders the target chip for %s as "%s"', (target, label) => {
    render(<DecisionCard item={item({ action: 'enroll_gap_sequence', target })} onAct={() => {}} />);
    expect(screen.getByTestId('target-chip')).toHaveTextContent(label);
    expect(TARGET_LABEL[target]).toBe(label);
  });

  it('renders no target chip when target is null', () => {
    render(<DecisionCard item={item({ target: null })} onAct={() => {}} />);
    expect(screen.queryByTestId('target-chip')).not.toBeInTheDocument();
  });

  it('renders "No hypothesis" when the hypothesis is null', () => {
    render(<DecisionCard item={item({ hypothesis: null })} onAct={() => {}} />);
    expect(screen.getByTestId('hypothesis-line')).toHaveTextContent('No hypothesis');
    expect(screen.queryByText('confidence', { exact: false })).not.toBeInTheDocument();
  });

  it('acted state hides the buttons and shows the plain-English action with the time', () => {
    render(<DecisionCard item={item({ humanAction: 'called', humanActionAt: '2026-09-23T14:05:00.000Z' })} onAct={() => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByTestId('acted')).toHaveTextContent('Acted: I called at 2026-09-23 14:05Z');
  });

  it('leads with the seller-facing action, and labels the buttons as recording, not performing, the action', () => {
    render(<DecisionCard item={item()} onAct={() => {}} />);
    expect(screen.getByTestId('seller-action-label')).toHaveTextContent('Call Jordan');
    expect(screen.getByText(/never send or enroll/i)).toBeInTheDocument();
    expect(screen.getByText('Log what you did')).toBeInTheDocument();
  });

  it('clicking "I did this" records the HumanAction that agrees with the recommendation, never the routing action string', () => {
    const onAct = vi.fn();
    render(<DecisionCard item={item({ action: 'call_now' })} onAct={onAct} />);
    fireEvent.click(screen.getByRole('button', { name: 'I did this' }));
    expect(onAct).toHaveBeenCalledWith('called');
  });

  it.each([
    ['research_required', 'researched'],
    ['approve_hypothesis', 'approved_hypothesis'],
    ['call_now', 'called'],
    ['enroll_gap_sequence', 'enrolled_by_hand'],
    ['one_off_email', 'emailed'],
    ['linkedin_manual_task', 'linkedin_messaged'],
    ['nurture', 'deferred'],
    // do_not_contact is not here: the router only emits it through R0 (blocked),
    // and cardReadiness treats the action as a block even if a payload forgets
    // `blocked`, so there is no "I did this" to press (final pass).
  ] as const)('"I did this" on %s records %s', (action, humanAction) => {
    const onAct = vi.fn();
    render(<DecisionCard item={item({ action })} onAct={onAct} />);
    fireEvent.click(screen.getByRole('button', { name: 'I did this' }));
    expect(onAct).toHaveBeenCalledWith(humanAction);
  });

  it('"I did something else" opens a chooser of valid human actions, never posts the literal string "other"', () => {
    const onAct = vi.fn();
    render(<DecisionCard item={item({ action: 'call_now' })} onAct={onAct} />);
    fireEvent.click(screen.getByRole('button', { name: 'I did something else' }));

    const select = screen.getByLabelText('What did you actually do?');
    // The recommended action (called, for call_now) is not offered as an "else" choice.
    expect(within(select).queryByRole('option', { name: 'I called' })).toBeNull();
    expect(within(select).getByRole('option', { name: 'I emailed' })).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'emailed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record' }));
    expect(onAct).toHaveBeenCalledWith('emailed');
    expect(onAct).not.toHaveBeenCalledWith('other');
  });

  it('Record stays disabled until a choice is made in the chooser', () => {
    render(<DecisionCard item={item()} onAct={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'I did something else' }));
    expect(screen.getByRole('button', { name: 'Record' })).toBeDisabled();
  });

  it('disables both buttons while acting and shows the act error inline', () => {
    render(<DecisionCard item={item()} onAct={() => {}} acting actError="already acted" />);
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'I did something else' })).toBeDisabled();
    expect(screen.getByTestId('act-error')).toHaveTextContent('already acted');
  });

  it('renders explain text literally: <b>x</b> in whyNow produces no bold element', () => {
    const { container } = render(
      <DecisionCard item={item({ explain: { ...EXPLAIN, whyNow: 'Trigger <b>x</b> fired <script>alert(1)</script>' } })} onAct={() => {}} />,
    );
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('Trigger <b>x</b> fired <script>alert(1)</script>')).toBeInTheDocument();
  });

  it('shows "Not stated" for a blank explain field instead of an empty cell', () => {
    render(<DecisionCard item={item({ explain: { ...EXPLAIN, wouldProveWrong: '   ' } })} onAct={() => {}} />);
    const term = screen.getByText('Would prove us wrong', { selector: 'dt' });
    expect(term.nextElementSibling).toHaveTextContent('Not stated');
  });
});

describe('<DecisionCard> blocked (safety refusal) cards', () => {
  it('a suppressed card shows SYSTEM BLOCK / Do not contact, never the human-action buttons', () => {
    render(<DecisionCard item={item({ blocked: true, lane: 'blocked', action: 'do_not_contact', ruleId: 'suppressed' })} onAct={() => {}} />);
    expect(screen.getByText('System block')).toBeInTheDocument();
    expect(screen.getByTestId('blocked-panel')).toHaveTextContent('Do not contact');
    expect(screen.getByTestId('blocked-panel')).toHaveTextContent('said stop');
    expect(screen.queryByText('Casey actually did')).toBeNull();
    expect(screen.queryByRole('button', { name: 'I did this' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'I did something else' })).toBeNull();
  });

  it('a suppression_unknown card is presented as a fail-closed block, not "go research this account"', () => {
    render(<DecisionCard item={item({ blocked: true, lane: 'blocked', action: 'research_required', ruleId: 'suppression_unknown' })} onAct={() => {}} />);
    const panel = screen.getByTestId('blocked-panel');
    expect(panel).toHaveTextContent('Suppression status unknown');
    expect(panel).toHaveTextContent('Nothing outbound is allowed until it can be verified');
    expect(panel).toHaveTextContent('No do-not-contact was recorded because of this');
    expect(panel).toHaveTextContent('Run routing again when the suppression service answers');
    expect(screen.queryByRole('button', { name: 'I did this' })).toBeNull();
  });

  it('an unrecognized blocked rule still refuses to show human-action buttons, with a generic message', () => {
    render(<DecisionCard item={item({ blocked: true, lane: 'blocked', ruleId: 'some_future_rule' })} onAct={() => {}} />);
    expect(screen.getByTestId('blocked-panel')).toHaveTextContent('some_future_rule');
    expect(screen.queryByRole('button', { name: 'I did this' })).toBeNull();
  });
});

describe('<DecisionCard> Seller Action Center (dogfood fix, 2026-09-25)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shows the seller-facing action, not the raw routing action, above the fold', () => {
    render(<DecisionCard item={item({ action: 'enroll_gap_sequence' })} onAct={() => {}} />);
    expect(screen.getByTestId('seller-action-label')).toHaveTextContent('Email Jordan');
  });

  it('renders working contact buttons for whatever contact data exists', () => {
    vi.stubEnv('NEXT_PUBLIC_HUBSPOT_PORTAL_ID', '3819073');
    render(
      <DecisionCard
        item={item({
          persona: {
            id: 41,
            personaKey: 'vp_operations',
            displayName: 'Jordan Reyes',
            email: 'jordan@acme.example',
            hubspotContactId: '900',
            phone: '(555) 123-4567',
            linkedinUrl: 'https://linkedin.com/in/jordanreyes',
          },
        })}
        onAct={() => {}}
      />,
    );
    const buttons = screen.getByTestId('contact-buttons');
    expect(within(buttons).getByRole('link', { name: /Email/ })).toHaveAttribute('href', 'mailto:jordan@acme.example');
    expect(within(buttons).getByRole('link', { name: /Call/ })).toHaveAttribute('href', 'tel:5551234567');
    expect(within(buttons).getByRole('link', { name: /LinkedIn/ })).toHaveAttribute('href', 'https://linkedin.com/in/jordanreyes');
    expect(within(buttons).getByRole('link', { name: /HubSpot contact/ })).toHaveAttribute('href', 'https://app.hubspot.com/contacts/3819073/contact/900');
  });

  it('is honest about missing contact fields instead of inventing anything', () => {
    render(
      <DecisionCard
        item={item({ persona: { id: 41, personaKey: 'vp_operations', displayName: 'Jordan Reyes', email: null, hubspotContactId: null, phone: null, linkedinUrl: null } })}
        onAct={() => {}}
      />,
    );
    const buttons = screen.getByTestId('contact-buttons');
    expect(within(buttons).getByText('email unavailable')).toBeInTheDocument();
    expect(within(buttons).getByText('phone unavailable')).toBeInTheDocument();
    expect(within(buttons).getByText('LinkedIn unavailable')).toBeInTheDocument();
    expect(within(buttons).queryByRole('link', { name: /HubSpot contact/ })).toBeNull();
  });

  it('links to the action pack (the hypothesis preview) for an outreach-eligible card with a hypothesis', () => {
    render(<DecisionCard item={item({ action: 'enroll_gap_sequence' })} onAct={() => {}} />);
    expect(screen.getByRole('link', { name: /Open email and call script/ })).toHaveAttribute('href', '/gap?lane=ready&open=dec_1#card-dec_1');
  });

  it('call_now leads with the tel: link and offers the action pack (call pack) as the secondary link (final pass)', () => {
    render(<DecisionCard item={item({ action: 'call_now', persona: { ...item().persona, phone: '(555) 123-4567' } })} onAct={() => {}} />);
    const actionable = screen.getByTestId('readiness-actionable');
    expect(within(actionable).getByRole('link', { name: /^Call / })).toHaveAttribute('href', 'tel:5551234567');
    expect(within(actionable).getByRole('link', { name: /Open email and call script/ })).toBeInTheDocument();
  });

  it('call_now without a phone is a missing prerequisite with a fix link, never a bare name', () => {
    render(<DecisionCard item={item({ action: 'call_now', persona: { ...item().persona, phone: null } })} onAct={() => {}} />);
    expect(screen.getByTestId('missing-prerequisite')).toHaveTextContent('No usable phone number');
    expect(screen.queryByTestId('readiness-actionable')).toBeNull();
  });

  it('a soft historical bounce card shows the warning, not a do-not-contact block', () => {
    render(<DecisionCard item={item({ action: 'linkedin_manual_task', persona: { ...item().persona, linkedinUrl: 'https://linkedin.com/in/x' }, suppression: { class: 'soft_deliverability', hits: ['modex_do_not_contact'] } })} onAct={() => {}} />);
    expect(screen.getByTestId('suppression-warning')).toHaveTextContent('Historical bounce, not a do-not-contact');
    expect(screen.queryByTestId('blocked-panel')).toBeNull();
  });

  it('research_required with no hypothesis shows the honest missing-prerequisite panel, never a fabricated outreach draft', () => {
    render(<DecisionCard item={item({ action: 'research_required', ruleId: 'no_hypothesis', hypothesis: null })} onAct={() => {}} />);
    const panel = screen.getByTestId('missing-prerequisite');
    expect(panel).toHaveTextContent('Missing prerequisite');
    expect(panel).toHaveTextContent('No hypothesis covers Jordan at Acme Foods');
    expect(within(panel).getByRole('link', { name: /Review or create a hypothesis/ })).toHaveAttribute('href', '/gap?lane=review');
    expect(screen.queryByRole('link', { name: /Open email and call script/ })).toBeNull();
    expect(screen.queryByTestId('rendered-email')).toBeNull();
  });

  it('a blocked card never shows contact buttons or an action pack link', () => {
    render(<DecisionCard item={item({ blocked: true, lane: 'blocked', action: 'do_not_contact', ruleId: 'suppressed' })} onAct={() => {}} />);
    expect(screen.queryByTestId('contact-buttons')).toBeNull();
    expect(screen.queryByRole('link', { name: /Open email and call script/ })).toBeNull();
    expect(screen.queryByTestId('missing-prerequisite')).toBeNull();
  });

  it('keeps the routing internals (rule id, explain, evidence counts) available but collapsed below the fold', () => {
    render(<DecisionCard item={item()} onAct={() => {}} />);
    const details = screen.getByTestId('routing-details');
    expect(details.tagName).toBe('DETAILS');
    expect(within(details).getByText('R7')).toBeInTheDocument();
    expect(within(details).getByTestId('explain')).toBeInTheDocument();
  });
});

describe('<DecisionCard> leak guard', () => {
  it('the fixture explain carries no forbidden private-intent phrase', () => {
    const texts = [EXPLAIN.whyAccount, EXPLAIN.whyPerson, EXPLAIN.whyProblem, EXPLAIN.whyNow, EXPLAIN.whyAction, EXPLAIN.wouldProveWrong];
    for (const text of texts) {
      for (const { label, pattern } of FORBIDDEN_EXPLAIN_PATTERNS) {
        expect(pattern.test(text), `fixture text "${text}" matches forbidden pattern ${label}`).toBe(false);
      }
    }
  });

  it('never renders intent_score or its value even when the account object carries intentScore', () => {
    const wider = {
      ...item(),
      account: { name: 'Acme Foods', hubspotCompanyId: '123', tam: 'in', tamTier: 'A', heatTier: 2, intentScore: 9137, lastIntentAt: '2026-09-22T00:00:00.000Z', intent_score: 9137 },
      persona: { id: 41, personaKey: 'vp_operations', displayName: 'Jordan Reyes', email: null, hubspotContactId: null, lastIntentSource: 'visited /demo/acme' },
    } as unknown as QueueItem;
    const { container } = render(<DecisionCard item={wider} onAct={() => {}} />);
    const text = container.textContent ?? '';
    expect(text).not.toContain('intent_score');
    expect(text).not.toContain('intentScore');
    expect(text).not.toContain('9137');
    expect(text).not.toContain('/demo/');
    expect(text).not.toContain('2026-09-22');
    for (const { label, pattern } of FORBIDDEN_EXPLAIN_PATTERNS) {
      expect(pattern.test(text), `rendered card matches forbidden pattern ${label}`).toBe(false);
    }
  });
});

describe('<DecisionCard> RESEARCH THIS', () => {
  it('a research card with an evidence gap shows Research this; running it never touches the draft route', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ runId: 'run1', outcome: 'insufficient_evidence', facts: [], rejected: [], conflicts: [] }), { status: 200 }));
    render(<DecisionCard item={item({ action: 'research_required', ruleId: 'evidence_thin' })} onAct={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Research this' }));
    expect(await screen.findByTestId('research-none')).toHaveTextContent('No defensible outreach trigger found.');
    expect(fetchMock.mock.calls.map(([u]) => String(u))).toEqual(['/api/gap/research']);
    fetchMock.mockRestore();
  });
});

describe('<DecisionCard> inline in the cockpit (weekend reduction, 2026-09-26)', () => {
  it('an open card renders its action pack inline, and its own open link becomes Close', () => {
    render(
      <DecisionCard
        item={item({ action: 'enroll_gap_sequence', ruleId: 'enroll', hypothesis: { id: 'hyp_1', status: 'active', family: 'hidden_capacity', confidence: 42 } })}
        onAct={vi.fn()}
        expanded={<p>PACK BODY</p>}
        closeHref="/gap?lane=ready"
      />,
    );
    expect(within(screen.getByTestId('card-expanded')).getByText('PACK BODY')).toBeInTheDocument();
    expect(screen.getByTestId('card-close')).toHaveAttribute('href', '/gap?lane=ready');
    expect(screen.queryByRole('link', { name: /Open email and call script/ })).toBeNull();
  });
});
