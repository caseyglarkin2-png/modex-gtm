// @vitest-environment node
/**
 * X10 (GAP OS sales execution engine, 2026-10-08): the copy revision binding (the review's B2). A revised copy for one
 * routing card and step is proposed (compiled, with the facts it rests on), then approved; once approved it is what
 * `loadActionPack` renders, hashes and finds the compile row for, so `prepareSellerEmail`, the Gmail draft and the
 * send bind the REVISED hash end to end. Pinned: a proposal is never used until approved; the newest approval wins
 * and the older one never renders again; a proposal whose compile is not cleared (reject, or review without
 * approval) cannot be approved; the pack's rendered copy, content hash, compile and unresolved citations all come
 * from the approved revision; without an approval the pack is the template render, unchanged.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { approveCopyRevision, COPY_REVISION_APPROVED, COPY_REVISION_PROPOSED, loadApprovedCopyRevision, loadProposedCopyRevisions, proposeCopyRevision } from '@/lib/gap/execution/copy-revision';
import { contentHashOf, loadActionPack } from '@/lib/gap/execution/action-pack';
import { STEPS_SCHEMA } from '@/lib/gap/sequence/steps';
import { STEP_PURPOSES } from '@/lib/gap/taxonomy';

const NOW = new Date('2026-10-08T16:00:00Z');
const SIGNAL = { id: 'sig-1', title: 'PepsiCo expands Tulsa DC', evidence_url: 'https://tulsaworld.com/p', external_ok: true, observed_at: new Date('2026-07-23T10:00:00Z'), freshness_expires_at: new Date('2027-01-01T00:00:00Z'), source_type: 'public_primary', claim_class: 'site_expansion', evidence_text: 'adds 180,000 square feet', source_kind: 'evidence_record', account_name: 'PepsiCo', type: 'site_expansion', metadata: null };

function world() {
  const db = ledgerDb({
    accounts: ['PepsiCo'],
    personas: [{ id: 7, name: 'Karen Ortiz', title: 'Director', email: 'karen@pepsico.com', phone: null, linkedin_url: null, hubspot_contact_id: null, account_name: 'PepsiCo', do_not_contact: false, email_valid: true, email_status: 'unverified' }],
    hypotheses: [{ id: 'hyp-1', account_name: 'PepsiCo', status: 'active', problem_family: 'dwell', observation: 'PepsiCo is expanding its Tulsa DC [S:sig-1].', problem_hypothesis: 'The gate falls behind.', sequence_version_id: 'ver-1', sequence_family_id: 'fam-1', primary_persona_id: 7, metadata: null, signals: [{ signal_id: 'sig-1', signal: SIGNAL }], events: [] }],
    routingDecisions: [{ id: 'dec-1', rule_id: 'r', action: 'enroll_gap_sequence', lane: 'ready', persona_id: 7, hypothesis_id: 'hyp-1', account_name: 'PepsiCo', inputs_snapshot: null, created_at: new Date('2026-10-01T00:00:00Z') }],
    sequenceVersions: [{ id: 'ver-1', family_id: 'fam-1', version: 1, status: 'frozen', family: { id: 'fam-1', name: 'Dwell', engine: 'modex_draft_queue', program: null }, steps: { schema: STEPS_SCHEMA, steps: [{ index: 0, delay: { value: 0, unit: 'business_days' }, purpose: STEP_PURPOSES[0], productProofAllowed: false, requiredEvidenceTypes: [], claimsUsed: [], templates: { subjectTemplate: 'A question on Tulsa', bodyTemplate: '{{first_name}}, {{observation}}\n\nMy guess is the gate is where the day goes. Is it?' } }] } }],
  }, NOW);
  return db;
}

const REVISED = { subject: 'Tulsa: the gate', body: 'Karen, PepsiCo is expanding its Tulsa DC [[SRC:sig-1]].\n\nMy guess is the gate team sees it first. Is the gate where the wait starts?' };

describe('X10: propose and approve', () => {
  it('a proposal is recorded with its hash and compile; it is not used until approved; the newest approval wins', async () => {
    const db = world();
    const c = db.client();
    expect(await loadApprovedCopyRevision(c, { decisionId: 'dec-1', stepIndex: 0 })).toBeNull();
    const p1 = await proposeCopyRevision(c, { decisionId: 'dec-1', hypothesisId: 'hyp-1', versionId: 'ver-1', stepIndex: 0, marked: REVISED, compileId: 'cmp-1', compileVerdict: 'pass', basis: { critique: 'make it about the gate', facts: ['sig-1'] }, proposedBy: 'agent:revise_message', taskId: 'at_1' }, NOW);
    expect(p1.contentHash).toBe(contentHashOf({ subject: REVISED.subject, body: REVISED.body.replace(' [[SRC:sig-1]]', '') }));
    expect(db.store.gapAuditEvent.filter((e) => e.kind === COPY_REVISION_PROPOSED)).toHaveLength(1);
    expect(await loadApprovedCopyRevision(c, { decisionId: 'dec-1', stepIndex: 0 })).toBeNull();
    const list = await loadProposedCopyRevisions(c, { decisionId: 'dec-1', stepIndex: 0 });
    expect(list.map((r) => r.revisionId)).toEqual([p1.revisionId]);
    expect(list[0]).toMatchObject({ queued: { subject: 'Tulsa: the gate' }, compileVerdict: 'pass', approved: false });

    const a = await approveCopyRevision(c, { decisionId: 'dec-1', revisionId: p1.revisionId, actor: 'casey@freightroll.com', via: 'email' }, new Date('2026-10-08T16:05:00Z'));
    expect(a).toMatchObject({ ok: true, contentHash: p1.contentHash });
    expect(db.store.gapAuditEvent.filter((e) => e.kind === COPY_REVISION_APPROVED)).toHaveLength(1);
    const approved = await loadApprovedCopyRevision(c, { decisionId: 'dec-1', stepIndex: 0 });
    expect(approved).toMatchObject({ revisionId: p1.revisionId, contentHash: p1.contentHash, marked: REVISED, approvedBy: 'casey@freightroll.com' });

    const p2 = await proposeCopyRevision(c, { decisionId: 'dec-1', hypothesisId: 'hyp-1', versionId: 'ver-1', stepIndex: 0, marked: { ...REVISED, subject: 'Tulsa: the second gate' }, compileId: 'cmp-2', compileVerdict: 'pass', basis: { critique: 'shorter', facts: ['sig-1'] }, proposedBy: 'agent:revise_message', taskId: 'at_2' }, new Date('2026-10-08T16:10:00Z'));
    expect((await loadApprovedCopyRevision(c, { decisionId: 'dec-1', stepIndex: 0 }))?.revisionId).toBe(p1.revisionId);
    await approveCopyRevision(c, { decisionId: 'dec-1', revisionId: p2.revisionId, actor: 'casey@freightroll.com', via: 'app' }, new Date('2026-10-08T16:11:00Z'));
    expect((await loadApprovedCopyRevision(c, { decisionId: 'dec-1', stepIndex: 0 }))?.revisionId).toBe(p2.revisionId);
    expect(await approveCopyRevision(c, { decisionId: 'dec-1', revisionId: p2.revisionId, actor: 'x', via: 'app' }, NOW)).toMatchObject({ ok: false, reason: 'already_approved' });
  });

  it('refuses to approve an unknown revision, a revision of another card, or one whose compile is not cleared', async () => {
    const db = world();
    const c = db.client();
    const rejected = await proposeCopyRevision(c, { decisionId: 'dec-1', hypothesisId: 'hyp-1', versionId: 'ver-1', stepIndex: 0, marked: REVISED, compileId: 'cmp-x', compileVerdict: 'reject', basis: { critique: 'x', facts: [] }, proposedBy: 'agent', taskId: 'at_3' }, NOW);
    expect(await approveCopyRevision(c, { decisionId: 'dec-1', revisionId: rejected.revisionId, actor: 'x', via: 'app' }, NOW)).toMatchObject({ ok: false, reason: 'compile_not_cleared' });
    const review = await proposeCopyRevision(c, { decisionId: 'dec-1', hypothesisId: 'hyp-1', versionId: 'ver-1', stepIndex: 0, marked: REVISED, compileId: 'cmp-y', compileVerdict: 'review_required', basis: { critique: 'x', facts: [] }, proposedBy: 'agent', taskId: 'at_4' }, NOW);
    expect(await approveCopyRevision(c, { decisionId: 'dec-1', revisionId: review.revisionId, actor: 'x', via: 'app' }, NOW)).toMatchObject({ ok: false, reason: 'compile_not_cleared' });
    expect(await approveCopyRevision(c, { decisionId: 'dec-1', revisionId: 'nope', actor: 'x', via: 'app' }, NOW)).toMatchObject({ ok: false, reason: 'revision_not_found' });
    expect(await approveCopyRevision(c, { decisionId: 'dec-2', revisionId: rejected.revisionId, actor: 'x', via: 'app' }, NOW)).toMatchObject({ ok: false, reason: 'revision_not_found' });
  });
});

describe('X10: loadActionPack binds the approved revision', () => {
  it('without an approval the pack is the template render; with one, the rendered copy, the hash, the compile and the citations are the revision\'s', async () => {
    const db = world();
    const c = db.client();
    const before = await loadActionPack(c, { hypothesisId: 'hyp-1', decisionId: 'dec-1', stepIndex: 0 });
    expect(before?.rendered?.queued.subject).toBe('A question on Tulsa');
    expect(before?.revision).toBeNull();
    const templateHash = before?.contentHash;

    const p = await proposeCopyRevision(c, { decisionId: 'dec-1', hypothesisId: 'hyp-1', versionId: 'ver-1', stepIndex: 0, marked: REVISED, compileId: 'cmp-1', compileVerdict: 'pass', basis: { critique: 'the gate', facts: ['sig-1'] }, proposedBy: 'agent', taskId: 'at_1' }, NOW);
    // The compile row that judged exactly the revised marked copy (what X09 writes through compile()).
    db.store.gapCompile.push({ id: 'cmp-1', hypothesis_id: 'hyp-1', sequence_version_id: 'ver-1', step_index: 0, verdict: 'pass', created_at: NOW, inputs_snapshot: { subject: REVISED.subject, body: REVISED.body } });
    const proposedOnly = await loadActionPack(c, { hypothesisId: 'hyp-1', decisionId: 'dec-1', stepIndex: 0 });
    expect(proposedOnly?.contentHash).toBe(templateHash);

    await approveCopyRevision(c, { decisionId: 'dec-1', revisionId: p.revisionId, actor: 'casey@freightroll.com', via: 'email' }, new Date('2026-10-08T16:05:00Z'));
    const after = await loadActionPack(c, { hypothesisId: 'hyp-1', decisionId: 'dec-1', stepIndex: 0 });
    expect(after?.rendered?.marked).toEqual(REVISED);
    expect(after?.rendered?.queued.body).not.toContain('[[SRC:');
    expect(after?.contentHash).toBe(p.contentHash);
    expect(after?.contentHash).not.toBe(templateHash);
    expect(after?.compile?.id).toBe('cmp-1');
    expect(after?.emailReady).toBe(true);
    expect(after?.unresolvedCitations).toEqual([]);
    expect(after?.revision).toMatchObject({ revisionId: p.revisionId, approvedBy: 'casey@freightroll.com' });

    // A citation the thesis does not carry stays unresolved on a revision too (never a template fixture's fact).
    const bad = await proposeCopyRevision(c, { decisionId: 'dec-1', hypothesisId: 'hyp-1', versionId: 'ver-1', stepIndex: 0, marked: { subject: 's', body: 'Karen, a fact [[SRC:other]].\n\nMy guess is x. Is it?' }, compileId: 'cmp-2', compileVerdict: 'pass', basis: { critique: 'x', facts: ['other'] }, proposedBy: 'agent', taskId: 'at_2' }, new Date('2026-10-08T16:20:00Z'));
    await approveCopyRevision(c, { decisionId: 'dec-1', revisionId: bad.revisionId, actor: 'x', via: 'app' }, new Date('2026-10-08T16:21:00Z'));
    const withBad = await loadActionPack(c, { hypothesisId: 'hyp-1', decisionId: 'dec-1', stepIndex: 0 });
    expect(withBad?.unresolvedCitations).toEqual(['other']);
    expect(withBad?.emailReady).toBe(false);
  });
});
