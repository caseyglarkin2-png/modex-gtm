/**
 * THE PIPELINE MUST NOT BE ABLE TO DELETE ITS OWN EVIDENCE.
 *
 * fovGate() used to write its per-build report to verification-rejections.md —
 * the same filename the audit agents use for hand-written, cited rejection
 * research. One pack build replaced that research with a five-line stub. It
 * destroyed evidence on ball, crowley and kroger before anyone noticed, and it
 * is the reason Crowley shipped three terminals it does not operate for weeks.
 *
 * This is an END-TO-END regression test, not a filename assertion. It runs the
 * REAL pack builder against a REAL account with a sentinel planted in the
 * research file, in both gate modes, and requires the file to come back
 * byte-identical. A test that merely checked "fov-report.md exists" would pass
 * against the exact bug it is supposed to catch.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ACCOUNT = 'ford'; // a real account with real research in the file
const DIR = join(ROOT, 'output', 'yard-audits', ACCOUNT);
const RESEARCH = join(DIR, 'verification-rejections.md');
const REPORT = join(DIR, 'fov-report.md');
const BACKUP = join(ROOT, 'node_modules', '.cache', `fov-guard-${ACCOUNT}.bak`);
const PACK = join(ROOT, 'public', 'demo-packs', 'ford.json');
const PACK_BACKUP = join(ROOT, 'node_modules', '.cache', 'fov-guard-ford-pack.bak');

const present = existsSync(RESEARCH) && existsSync(PACK);
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');

const SENTINEL = [
  '',
  '<!-- FOV-NONDESTRUCTIVE-SENTINEL',
  'If a pack rebuild can remove this line, it can remove a Tier-1 citation that',
  'took an analyst an hour to establish, and nobody will notice until a prospect',
  'is shown a yard the account does not operate.',
  '-->',
  '',
].join('\n');

function buildPack(mode: 'warn' | 'enforce') {
  execFileSync(
    process.execPath,
    ['node_modules/tsx/dist/cli.mjs', 'scripts/yard-audit/build-demo-pack.ts', ACCOUNT],
    { cwd: ROOT, env: { ...process.env, FOV_GATE: mode, FORCE_REBUILD: '1' }, stdio: 'ignore' },
  );
}

describe.skipIf(!present)('pack regeneration cannot destroy hand-written evidence', () => {
  let originalSha = '';

  beforeAll(() => {
    copyFileSync(RESEARCH, BACKUP);
    copyFileSync(PACK, PACK_BACKUP);
    writeFileSync(RESEARCH, readFileSync(RESEARCH, 'utf8') + SENTINEL);
    originalSha = sha(RESEARCH);
  });

  afterAll(() => {
    copyFileSync(BACKUP, RESEARCH);
    copyFileSync(PACK_BACKUP, PACK);
    rmSync(BACKUP, { force: true });
    rmSync(PACK_BACKUP, { force: true });
    rmSync(REPORT, { force: true });
  });

  it('leaves verification-rejections.md BYTE-IDENTICAL after a warn-mode build', () => {
    buildPack('warn');
    expect(sha(RESEARCH), 'a pack build modified the hand-written research file').toBe(originalSha);
    expect(readFileSync(RESEARCH, 'utf8')).toContain('FOV-NONDESTRUCTIVE-SENTINEL');
  });

  it('leaves verification-rejections.md BYTE-IDENTICAL after an enforce-mode build', () => {
    buildPack('enforce');
    expect(sha(RESEARCH), 'a pack build modified the hand-written research file').toBe(originalSha);
    expect(readFileSync(RESEARCH, 'utf8')).toContain('FOV-NONDESTRUCTIVE-SENTINEL');
  });

  it('writes its generated report to a SEPARATE, disposable file', () => {
    buildPack('warn');
    expect(existsSync(REPORT), 'fovGate produced no fov-report.md').toBe(true);
    const report = readFileSync(REPORT, 'utf8');
    expect(report).toMatch(/^# FOV (warn|enforce) report/);
    // The generated report must never be mistaken for the research.
    expect(report).not.toContain('FOV-NONDESTRUCTIVE-SENTINEL');
    expect(REPORT).not.toBe(RESEARCH);
  });

  it('keeps the research file out of the generated-output path entirely', () => {
    // Belt and braces: no shipped source may name the research file as a WRITE
    // target. This is what actually regressed, so it is pinned directly.
    const gate = readFileSync(join(ROOT, 'scripts', 'yard-audit', 'build-demo-pack.ts'), 'utf8');
    const writeTargets = [...gate.matchAll(/writeFileSync\(\s*join\([^)]*?,\s*'([^']+)'\s*\)/g)].map((m) => m[1]);
    expect(writeTargets).not.toContain('verification-rejections.md');
  });
});
