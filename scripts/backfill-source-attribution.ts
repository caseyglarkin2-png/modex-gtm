#!/usr/bin/env npx tsx
/**
 * backfill-source-attribution.ts
 *
 * One-shot backfill that ensures every priority-A and priority-B account's
 * latest GeneratedContent has a source-attribution marker on its
 * version_metadata. Two outcomes per row:
 *
 *   - The asset already has a `source_backed_contract_v1` block →
 *     skipped (no-op).
 *   - The asset text contains `[[SRC:xxx]]` markers AND we have a
 *     generation-input contract on metadata → reconstruct a contract via
 *     `buildSourceBackedContractFromGeneratedText` and persist it.
 *   - Otherwise → write a definitive legacy stub
 *     `{ contract: 'legacy', citation_count: 0, citation_threshold: 1 }`
 *     so the citation badge in the outreach shell renders "unsourced"
 *     unambiguously rather than reading as a missing-data ambiguity.
 *
 * Idempotent: running twice is a no-op for any row that has either a real
 * contract or the legacy stub.
 *
 * Usage:
 *   npx tsx scripts/backfill-source-attribution.ts --dry-run [--limit 50]
 *   npx tsx scripts/backfill-source-attribution.ts --limit 50
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  buildSourceBackedContractFromGeneratedText,
  extractSourceMarkers,
} from '../src/lib/source-backed/attribution';

const LEGACY_STUB = {
  contract: 'legacy',
  citation_count: 0,
  citation_threshold: 1,
} as const;

function readFlag(name: string): boolean {
  return process.argv.includes(name);
}

function readNumberFlag(name: string, fallback: number): number {
  const i = process.argv.findIndex((a) => a === name);
  if (i < 0) return fallback;
  const n = Number(process.argv[i + 1]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

type GeneratedContentRow = {
  id: number;
  account_name: string;
  content: string;
  version_metadata: unknown;
};

function hasSourceBackedContract(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') return false;
  const m = metadata as Record<string, unknown>;
  const candidate = m.source_backed_contract_v1 ?? m.source_attribution;
  if (!candidate || typeof candidate !== 'object') return false;
  const c = candidate as Record<string, unknown>;
  return c.contract === 'source_backed_contract_v1' || c.contract === 'legacy';
}

function readGenerationInput(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return null;
  const m = metadata as Record<string, unknown>;
  const candidate = m.generation_input ?? m.input;
  if (!candidate || typeof candidate !== 'object') return null;
  const obj = candidate as Record<string, unknown>;
  if (!Array.isArray(obj.signals) || !Array.isArray(obj.proof_context) || !Array.isArray(obj.recommended_contacts)) {
    return null;
  }
  return obj as unknown as Parameters<typeof buildSourceBackedContractFromGeneratedText>[0]['generationInput'];
}

async function loadCandidates(prisma: PrismaClient, limit: number): Promise<GeneratedContentRow[]> {
  const accounts = await prisma.account.findMany({
    where: { OR: [{ priority_band: { in: ['A', 'B'] } }, { tier: 'Tier 1' }] },
    orderBy: [{ priority_score: 'desc' }, { rank: 'asc' }],
    take: limit,
    select: { name: true },
  });
  if (accounts.length === 0) return [];

  const rows = await prisma.$queryRaw<GeneratedContentRow[]>`
    SELECT DISTINCT ON (account_name) id, account_name, content, version_metadata
    FROM generated_content
    WHERE account_name = ANY(${accounts.map((a) => a.name)})
    ORDER BY account_name, version DESC, id DESC
  `;
  return rows;
}

async function main() {
  const dryRun = readFlag('--dry-run');
  const limit = readNumberFlag('--limit', 50);
  const prisma = new PrismaClient();

  const summary = {
    mode: dryRun ? 'DRY_RUN' : 'LIVE',
    candidates_scanned: 0,
    already_attributed: 0,
    contracts_built: 0,
    legacy_stubs_written: 0,
    per_row: [] as Array<{ id: number; account: string; outcome: string }>,
  };

  try {
    const rows = await loadCandidates(prisma, limit);
    summary.candidates_scanned = rows.length;
    console.log(`[backfill-source-attribution] mode=${summary.mode} candidates=${rows.length}`);

    for (const row of rows) {
      if (hasSourceBackedContract(row.version_metadata)) {
        summary.already_attributed += 1;
        summary.per_row.push({ id: row.id, account: row.account_name, outcome: 'already_attributed' });
        continue;
      }

      const markers = extractSourceMarkers(row.content);
      const generationInput = readGenerationInput(row.version_metadata);
      const contract = markers.length > 0 && generationInput
        ? buildSourceBackedContractFromGeneratedText({
            content: row.content,
            accountName: row.account_name,
            generationInput,
          })
        : null;

      if (contract) {
        if (!dryRun) {
          const baseMetadata = (row.version_metadata && typeof row.version_metadata === 'object'
            ? (row.version_metadata as Record<string, unknown>)
            : {});
          await prisma.generatedContent.update({
            where: { id: row.id },
            data: {
              version_metadata: {
                ...baseMetadata,
                source_backed_contract_v1: contract,
                source_attribution_backfilled_at: new Date().toISOString(),
              },
            },
          });
        }
        summary.contracts_built += 1;
        summary.per_row.push({ id: row.id, account: row.account_name, outcome: 'contract_built' });
        continue;
      }

      // Legacy stub: definitively mark unsourced so the UI badge is unambiguous.
      if (!dryRun) {
        const baseMetadata = (row.version_metadata && typeof row.version_metadata === 'object'
          ? (row.version_metadata as Record<string, unknown>)
          : {});
        await prisma.generatedContent.update({
          where: { id: row.id },
          data: {
            version_metadata: {
              ...baseMetadata,
              source_backed_contract_v1: LEGACY_STUB,
              source_attribution_backfilled_at: new Date().toISOString(),
            },
          },
        });
      }
      summary.legacy_stubs_written += 1;
      summary.per_row.push({ id: row.id, account: row.account_name, outcome: 'legacy_stub' });
    }

    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[backfill-source-attribution] failed', err);
  process.exit(1);
});
