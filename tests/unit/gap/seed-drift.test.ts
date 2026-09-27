/**
 * Release C review B2 (red team T7): until the live seed versions are
 * rewritten, a seed-program version still carries the four-step fixture copy.
 * Nothing drafts, sends or enrolls from it.
 */
import { describe, expect, it } from 'vitest';
import { SEED_FAMILIES, SEED_PROGRAM } from '@/lib/gap/sequences/families';
import { seedCopyOutdated } from '@/lib/gap/sequences/seed-drift';
import { createSellerGmailDraft } from '@/lib/gap/execution/seller-draft';
import { LEGACY_HC } from './fixtures/legacy-hc';
import { NOW, db, prismaOf, baseDeps } from './fixtures/seller-db';

const HC_SEED = SEED_FAMILIES.find((f) => f.name === LEGACY_HC.name)!;

describe('seedCopyOutdated', () => {
  it('the legacy four-step copy in a seed-program family is outdated; the current seed is not', () => {
    expect(HC_SEED).toBeTruthy();
    expect(seedCopyOutdated({ steps: LEGACY_HC.steps, family: { name: LEGACY_HC.name, program: SEED_PROGRAM } })).toBe(true);
    expect(seedCopyOutdated({ steps: HC_SEED.steps, family: { name: HC_SEED.name, program: SEED_PROGRAM } })).toBe(false);
  });

  it('a seed-program family the code no longer seeds is outdated', () => {
    expect(seedCopyOutdated({ steps: HC_SEED.steps, family: { name: 'Retired Family', program: SEED_PROGRAM } })).toBe(true);
  });

  it('versions outside the seed program are never judged here', () => {
    expect(seedCopyOutdated({ steps: LEGACY_HC.steps, family: { name: LEGACY_HC.name, program: 'top100-2026-09-12' } })).toBe(false);
    expect(seedCopyOutdated({ steps: LEGACY_HC.steps, family: { name: LEGACY_HC.name, program: null } })).toBe(false);
    expect(seedCopyOutdated({ steps: LEGACY_HC.steps, family: null })).toBe(false);
  });
});

describe('the send gate refuses copy_version_outdated', () => {
  it('a seed-program version with the legacy copy is refused before any Gmail call; the rewritten seed drafts', async () => {
    const d = db();
    d.versions[0].family = { ...d.versions[0].family, name: LEGACY_HC.name, program: SEED_PROGRAM };
    d.versions[0].steps = LEGACY_HC.steps;
    const deps = baseDeps(d);
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, deps);
    expect(r).toMatchObject({ ok: false, reason: 'copy_version_outdated' });

    const d2 = db();
    d2.versions[0].family = { ...d2.versions[0].family, name: HC_SEED.name, program: SEED_PROGRAM };
    d2.versions[0].steps = HC_SEED.steps;
    const ok = await createSellerGmailDraft(prismaOf(d2), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d2));
    expect(ok).toMatchObject({ ok: true });
  });
});
