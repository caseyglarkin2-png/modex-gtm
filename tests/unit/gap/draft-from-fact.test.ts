// @vitest-environment node
/**
 * Batch item 2 (audit at 31f09c71): NOT THIS STORY promised "GAP will not propose this story again", yet drafting
 * the same fact for the same person found the rejected row and answered `preparation: 'submitted'`, "under review"
 * with nothing under review. draftThesisFromFact now answers a set-aside story with its reason, a closed one as
 * closed, an approved or active one as already in use; and (item 2a) a fact past its currentness with the words.
 */
import { describe, expect, it, vi } from 'vitest';
import { draftThesisFromFact, STORY_SET_ASIDE_DETAIL } from '@/lib/gap/story/draft-from-fact';
import { VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';

const NOW = new Date('2026-10-07T15:00:00Z');
const TULSA = 'PepsiCo will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.';
const fact = (over: Record<string, unknown> = {}) => ({ id: 'f-tulsa', account_name: 'PepsiCo', source_kind: 'evidence_record', source_type: 'public_secondary', evidence_text: TULSA, evidence_url: 'https://news.example.com/pepsico/tulsa', observed_at: new Date('2026-09-20T00:00:00Z'), external_ok: true, metadata: { verified: VERIFIED_EXCERPT }, title: 'PepsiCo to cease warehouse operations at Oklahoma production site', claim_class: null, type: 'site_expansion', freshness_expires_at: null, ...over });

function prismaWith(existing: { id: string; status: string; problem_family: string } | null, f = fact()) {
  return {
    prospectingSignal: { findUnique: vi.fn(async () => f) },
    prospectingHypothesis: {
      findFirst: vi.fn(async (args: { where?: { source_ref?: string } }) => (args.where?.source_ref ? existing : null)),
      findUnique: vi.fn(async () => (existing ? { status: existing.status } : null)),
      updateMany: vi.fn(),
    },
  };
}
const input = { accountName: 'PepsiCo', factId: 'f-tulsa', personaId: 7, persona: 'transportation', observation: `PepsiCo to cease warehouse operations at Oklahoma production site: "${TULSA.replace(/\.$/, '')}" [S:f-tulsa].`, problemHypothesis: 'My guess is that the move loads the remaining yards.', falsificationQuestions: ['How do trailers get checked in today?'], whatANoMeans: 'No added waiting: closed.', problemFamily: null, actor: 'casey@freightroll.com', now: NOW } as never;

describe('drafting a story again after it was set aside or used (item 2)', () => {
  it('a story set aside with NOT THIS STORY is refused with its reason, never reported submitted, and nothing is written', async () => {
    const p = prismaWith({ id: 'h-1', status: 'rejected', problem_family: 'hidden_capacity' });
    expect(await draftThesisFromFact(p, input)).toEqual({ ok: false, reason: 'story_set_aside', detail: STORY_SET_ASIDE_DETAIL });
    expect(p.prospectingHypothesis.updateMany).not.toHaveBeenCalled();
  });

  it('a story whose thesis is closed by its outcome is refused as closed', async () => {
    expect(await draftThesisFromFact(prismaWith({ id: 'h-1', status: 'expired', problem_family: 'hidden_capacity' }), input)).toEqual({ ok: false, reason: 'story_closed', detail: "This story's thesis is expired: it is not drafted again." });
  });

  it('an approved or active story is already in use, never "under review"; one under review is submitted', async () => {
    for (const status of ['approved', 'active'] as const) {
      expect(await draftThesisFromFact(prismaWith({ id: 'h-1', status, problem_family: 'hidden_capacity' }), input)).toMatchObject({ ok: true, hypothesisId: 'h-1', existing: true, preparation: 'in_use' });
    }
    expect(await draftThesisFromFact(prismaWith({ id: 'h-1', status: 'review_required', problem_family: 'hidden_capacity' }), input)).toMatchObject({ ok: true, preparation: 'submitted' });
  });

  it('item 2a: a fact past its currentness is refused with the seller words, before anything is looked up or written', async () => {
    const p = prismaWith(null, fact({ type: 'news', observed_at: new Date('2026-07-23T00:00:00Z') }));
    expect(await draftThesisFromFact(p, input)).toEqual({ ok: false, reason: 'fact_not_outreach_evidence', detail: 'This story is too old for a first touch: it was current until Sep 5, 2026.' });
    expect(p.prospectingHypothesis.findFirst).not.toHaveBeenCalled();
  });
});
