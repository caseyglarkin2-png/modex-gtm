#!/usr/bin/env npx tsx
/**
 * clawd → modex-gtm Signal Bridge — Importer
 *
 * Turns a clawd intent/signal account into a live /for/{slug} microsite +
 * send-ready personas, automatically.
 *
 *   npx tsx scripts/import-signal-account.ts <domain> [flags]
 *
 * Flags:
 *   --dry-run         Fetch + map + print, write nothing (no files, no DB, no generate)
 *   --skip-generate   Upsert data but don't run the microsite generator
 *   --skip-db         Don't touch Prisma (only accounts.json/personas.json + generate)
 *
 * Auth: set MC_API_TOKEN (the token modex-gtm already uses to call clawd).
 * Base URL defaults to the production control plane; override with CLAWD_BASE_URL.
 *
 * Pipeline (reuses existing pieces — does not reinvent):
 *   1. fetchClawdExport         — the live export contract
 *   2. mapClawdExport           — pure mapping → accounts.json + personas.json + Prisma payloads
 *   3. upsert JSON (idempotent) — feeds scripts/generate-microsite-data.ts (its existing input)
 *   4. upsert Prisma            — Account + Persona (send-readiness)
 *   5. generate-microsite-data  — builds the demo-pack → /for/{slug}
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { fetchClawdExport, resolveClawdBaseUrl } from '../src/lib/signal-bridge/clawd-export-client';
import { mapClawdExport } from '../src/lib/signal-bridge/map-export';
import { upsertByKey } from '../src/lib/signal-bridge/upsert';
import type { AccountJsonEntry, PersonaJsonEntry } from '../src/lib/signal-bridge/types';

const ROOT = path.resolve(__dirname, '..');
const ACCOUNTS_JSON = path.join(ROOT, 'src/lib/data/accounts.json');
const PERSONAS_JSON = path.join(ROOT, 'src/lib/data/personas.json');

interface Flags {
  dryRun: boolean;
  skipGenerate: boolean;
  skipDb: boolean;
}

function parseArgs(argv: string[]): { domain: string; flags: Flags } {
  const positionals = argv.filter((a) => !a.startsWith('--'));
  const flagSet = new Set(argv.filter((a) => a.startsWith('--')));
  const domain = positionals[0];
  if (!domain) {
    console.error('Usage: npx tsx scripts/import-signal-account.ts <domain> [--dry-run] [--skip-generate] [--skip-db]');
    process.exit(1);
  }
  return {
    domain,
    flags: {
      dryRun: flagSet.has('--dry-run'),
      skipGenerate: flagSet.has('--skip-generate'),
      skipDb: flagSet.has('--skip-db'),
    },
  };
}

function readJsonArray<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
}

function writeJsonArray(filePath: string, data: unknown[]): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

async function upsertPrisma(
  prisma: PrismaClient,
  mapped: ReturnType<typeof mapClawdExport>,
): Promise<void> {
  const { prismaAccount, prismaPersonas } = mapped;

  await prisma.account.upsert({
    where: { name: prismaAccount.name },
    create: prismaAccount,
    update: {
      // Refresh the signal-driven fields; leave human-managed status columns alone.
      vertical: prismaAccount.vertical,
      signal_type: prismaAccount.signal_type,
      why_now: prismaAccount.why_now,
      primo_angle: prismaAccount.primo_angle,
      source: prismaAccount.source,
      source_url_1: prismaAccount.source_url_1,
      warm_intro: prismaAccount.warm_intro,
      notes: prismaAccount.notes,
    },
  });

  for (const persona of prismaPersonas) {
    const { account_name, ...rest } = persona;
    await prisma.persona.upsert({
      where: { persona_id: persona.persona_id },
      create: {
        ...rest,
        account: { connect: { name: account_name } },
      },
      update: {
        title: persona.title,
        persona_lane: persona.persona_lane,
        role_in_deal: persona.role_in_deal,
        email: persona.email,
        email_status: persona.email_status,
        email_confidence: persona.email_confidence,
        email_valid: persona.email_valid,
        company_domain: persona.company_domain,
        persona_status: persona.persona_status,
        is_contact_ready: persona.is_contact_ready,
        do_not_contact: persona.do_not_contact,
        source_type: persona.source_type,
        source_url: persona.source_url,
        notes: persona.notes,
      },
    });
  }
}

async function main() {
  const { domain, flags } = parseArgs(process.argv.slice(2));

  console.log(`\n=== Signal Bridge Import — ${domain} ===`);
  console.log(`clawd base: ${resolveClawdBaseUrl()}`);

  const exported = await fetchClawdExport(domain);
  const mapped = mapClawdExport(exported);
  const { slug, account, personasJson, prismaPersonas, warmIntroOnly } = mapped;

  const sendReady = prismaPersonas.filter((p) => p.is_contact_ready).length;
  console.log(`\nCompany:      ${account.name}  (slug: ${slug})`);
  console.log(`Fit:          ${exported.fit.fit_tier ?? '—'} · ${exported.fit.segment ?? '—'} · ${exported.fit.facility_count ?? '—'} sites`);
  console.log(`Signals:      ${exported.signals.length}`);
  console.log(`Committee:    ${personasJson.length} (${sendReady} send-ready, ${personasJson.length - sendReady} identified)`);
  console.log(`Warm-intro:   ${warmIntroOnly ? 'YES — personas marked do-not-contact (no auto-cold)' : 'no'}`);

  if (flags.dryRun) {
    console.log('\n[dry-run] No files written, no DB writes, no generation.');
    console.log(JSON.stringify({ account, personasJson, prismaPersonas }, null, 2));
    return;
  }

  // ── Upsert accounts.json (the generator's input) ──────────────────────
  const accounts = readJsonArray<AccountJsonEntry>(ACCOUNTS_JSON);
  const accountExists = accounts.some((a) => a.name === account.name);

  if (warmIntroOnly && accountExists) {
    // Preserve curated/hand-tuned account data for warm-intro accounts (e.g. Dannon);
    // only the personas get refreshed + marked warm-intro.
    console.log(`\nPreserved existing accounts.json entry for ${account.name} (warm-intro guardrail).`);
  } else {
    writeJsonArray(ACCOUNTS_JSON, upsertByKey(accounts, [account], (a) => a.name));
    console.log(`\nUpserted accounts.json (${accountExists ? 'updated' : 'added'} ${account.name}).`);
  }

  // ── Upsert personas.json ──────────────────────────────────────────────
  const personas = readJsonArray<PersonaJsonEntry>(PERSONAS_JSON);
  writeJsonArray(PERSONAS_JSON, upsertByKey(personas, personasJson, (p) => p.persona_id));
  console.log(`Upserted personas.json (${personasJson.length} personas for ${account.name}).`);

  // ── Upsert Prisma ─────────────────────────────────────────────────────
  if (flags.skipDb) {
    console.log('Skipped Prisma writes (--skip-db).');
  } else {
    const prisma = new PrismaClient();
    try {
      await upsertPrisma(prisma, mapped);
      console.log(`Upserted Prisma Account + ${prismaPersonas.length} Persona rows.`);
    } finally {
      await prisma.$disconnect();
    }
  }

  // ── Generate the microsite ────────────────────────────────────────────
  if (flags.skipGenerate) {
    console.log('Skipped microsite generation (--skip-generate).');
  } else {
    console.log('\nRunning generate-microsite-data...');
    execFileSync('npx', ['tsx', 'scripts/generate-microsite-data.ts'], {
      cwd: ROOT,
      stdio: 'inherit',
    });
  }

  console.log(`\n✅ Done. Microsite: /for/${slug}`);
}

main().catch((error) => {
  console.error('\n❌ Signal bridge import failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
