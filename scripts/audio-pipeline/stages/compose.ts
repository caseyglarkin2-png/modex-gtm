import type { AccountMicrositeData } from '@/lib/microsites/schema';
import type { DossierMatch } from '../lib/dossiers';

export interface ComposeInput {
  account: AccountMicrositeData;
  dossiers: DossierMatch[];
}

/**
 * Build the deep-research prompt that's submitted to Gemini. Layered:
 *
 *   1. Role + framing (analyst, private memo register).
 *   2. Account facts (name, vertical, network shape).
 *   3. Internal dossier bodies, if any — Gemini extends rather than re-derives.
 *   4. Output spec — 7-minute spoken form, anti-sales register, five beats.
 */
export function composeResearchPrompt(input: ComposeInput): string {
  const { account, dossiers } = input;
  const facilityCount = account.network?.facilityCount;
  const facilityTypes = account.network?.facilityTypes?.join(' + ') ?? 'mixed';
  const facilityLine = facilityCount
    ? `${facilityCount}-facility footprint (${facilityTypes})`
    : `unknown facility count (types: ${facilityTypes})`;

  const dossierBlock = dossiers.length
    ? [
        '## Internal research dossiers',
        '',
        'These were prepared by our team. Extend rather than re-derive — assume these facts are already known.',
        '',
        ...dossiers.map((d) => `### ${d.filename}\n\n${d.body.trim()}\n`),
      ].join('\n')
    : '## Internal research dossiers\n\n(no internal dossier on file — do your own discovery, no need to flag the gap)';

  return [
    'You are an analyst preparing a private 7-minute spoken brief for an executive at the named account. Match the register of a private memorandum: anti-sales, observational, citation-grounded, willing to be wrong out loud.',
    '',
    '## Account',
    `- Name: ${account.accountName}`,
    `- Vertical: ${account.vertical ?? 'unknown'}`,
    `- Network shape: ${facilityLine}`,
    '',
    dossierBlock,
    '',
    '## Output',
    'Produce a deep-research report covering:',
    '1. Yard execution as a network constraint at this account specifically',
    '2. What the legacy YMS world misses about networks of this archetype',
    '3. The gap between site-level optimization and network-level coordination',
    '4. What 237 comparable facilities have taught about this gap',
    '5. The first concrete step the executive could take tomorrow',
    '',
    'Keep it to ~7 minutes spoken (roughly 1,000–1,200 words). Cite where possible. End with the single most important thing for this executive to internalize.',
  ].join('\n');
}
