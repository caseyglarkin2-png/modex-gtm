import { it, expect } from 'vitest';
import { DemoPackSchema } from '../pack-schema';
import fs from 'node:fs';
import path from 'node:path';

it.skip('every shipped site carries a verification verdict + citation', () => {
  // un-skip after the FOV backfill task (0.4). Schema must support the shape now.
  const dir = path.join(process.cwd(), 'public', 'demo-packs');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const pack = DemoPackSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
    for (const s of pack.network.sites) {
      expect(s.verification, `${f}:${s.id} missing verification`).toBeTruthy();
      expect(['confirmed', 'probable']).toContain(s.verification!.verdict);
      expect(s.verification!.citations.length).toBeGreaterThanOrEqual(1);
      expect(s.verification!.checkedDivestiture).toBe(true);
    }
  }
});

it('DemoPackSchema accepts a site with a valid verification block', () => {
  // Build a minimal valid site by parsing an existing pack and attaching a verification block.
  const dir = path.join(process.cwd(), 'public', 'demo-packs');
  const anyPack = JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir).filter(f=>f.endsWith('.json'))[0]), 'utf8'));
  anyPack.network.sites[0].verification = {
    verdict: 'confirmed', operator: 'self', tenancy: 'leased',
    citations: [{ tier: 1, url: 'https://example.com/10k', date: '2026-02-14', type: '10-K Item 2', claim: 'lists site' }],
    imageryDate: '2024-08', checkedDivestiture: true, checkedBankruptcyEra: false,
    rationale: 'listed in latest 10-K', verifiedBy: 'agent', verifiedAt: '2026-06-18',
  };
  expect(() => DemoPackSchema.parse(anyPack)).not.toThrow();
});

it('DemoPackSchema rejects a verification block missing citations field', () => {
  const dir = path.join(process.cwd(), 'public', 'demo-packs');
  const anyPack = JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir).filter(f=>f.endsWith('.json'))[0]), 'utf8'));
  anyPack.network.sites[0].verification = { verdict: 'confirmed', checkedDivestiture: true, rationale: 'x', verifiedAt: '2026-06-18' };
  expect(() => DemoPackSchema.parse(anyPack)).toThrow();
});
