import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { collectDossiers } from '@/scripts/audio-pipeline/lib/dossiers';

const FIXTURES = resolve(__dirname, '../fixtures/audio-pipeline/dossiers');

describe('collectDossiers', () => {
  it('matches dossier filenames to account slugs after hyphen-strip + lowercase normalization', async () => {
    const out = await collectDossiers({ accountSlug: 'general-mills', dossiersDir: FIXTURES });
    expect(out.matches).toHaveLength(1);
    expect(out.matches[0].path).toContain('paul-gallagher-generalmills-dossier.md');
    expect(out.matches[0].body).toContain('Paul Gallagher');
  });

  it('matches "campbell-s" account slug to "campbells" dossier filename', async () => {
    const out = await collectDossiers({ accountSlug: 'campbell-s', dossiersDir: FIXTURES });
    expect(out.matches).toHaveLength(1);
    expect(out.matches[0].path).toContain('dan-poland-campbells-dossier.md');
  });

  it('returns empty matches when no dossier exists for the account', async () => {
    const out = await collectDossiers({ accountSlug: 'dannon', dossiersDir: FIXTURES });
    expect(out.matches).toEqual([]);
    expect(out.fallback).toBe(true);
  });

  it('returns multiple matches when an account has more than one person dossier', async () => {
    // Add a second toyota dossier on the fly
    const fs = await import('node:fs/promises');
    const second = resolve(FIXTURES, 'another-person-toyota-dossier.md');
    await fs.writeFile(second, '# Second Toyota dossier\n', 'utf8');
    try {
      const out = await collectDossiers({ accountSlug: 'toyota', dossiersDir: FIXTURES });
      expect(out.matches).toHaveLength(2);
    } finally {
      await fs.unlink(second);
    }
  });

  it('does not match when account slug is a substring of a longer person token', async () => {
    const fs = await import('node:fs/promises');
    const trap = resolve(FIXTURES, 'someone-stafford-dossier.md');
    await fs.writeFile(trap, '# Stafford trap\n', 'utf8');
    try {
      const out = await collectDossiers({ accountSlug: 'ford', dossiersDir: FIXTURES });
      expect(out.matches).toEqual([]);
      expect(out.fallback).toBe(true);
    } finally {
      await fs.unlink(trap);
    }
  });

  it('skips a dossier whose body cannot be read but still returns matches from readable ones', async () => {
    const fs = await import('node:fs/promises');
    const broken = resolve(FIXTURES, 'broken-toyota-dossier.md');
    await fs.writeFile(broken, '# placeholder\n', 'utf8');
    // Make the file unreadable for the user. On systems where chmod doesn't apply
    // (e.g. some Windows mounts), this case is exercised by the implementation's
    // try/catch but not by this test — it's a no-op in that case and we still
    // expect the readable file to come back. So we assert "at least the somebody
    // dossier is returned".
    try {
      await fs.chmod(broken, 0o000);
    } catch {
      // chmod failed — fixture won't actually be unreadable; test still validates
      // that the function tolerates the file existing.
    }
    try {
      const out = await collectDossiers({ accountSlug: 'toyota', dossiersDir: FIXTURES });
      const filenames = out.matches.map((m) => m.filename);
      expect(filenames).toContain('somebody-toyota-dossier.md');
      // Either broken-toyota was read (chmod no-op) OR it was skipped (chmod worked).
      // Both outcomes are acceptable; what's NOT acceptable is throwing.
    } finally {
      try { await fs.chmod(broken, 0o644); } catch {}
      await fs.unlink(broken);
    }
  });
});
