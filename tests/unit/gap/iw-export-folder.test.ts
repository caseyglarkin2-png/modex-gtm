// @vitest-environment node
/**
 * The export folder (2026-10-09): a JSON batch is taken as is; a Markdown issue with a fenced JSON block uses the
 * block; an issue without one is cut by its producer's parser (the producer read from the frontmatter, the file name
 * or the heading); an unknown file is reported unsupported, never silently skipped; the file hash is stable.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectProducer, fileHash, readFolderFile, recordsBlockOf } from '@/lib/gap/signals/export-folder';

const fx = (name: string) => readFileSync(path.join(process.cwd(), 'tests/fixtures/gap/intelligence', name), 'utf8');

describe('the export folder reader', () => {
  it('a JSON batch, a Markdown block, a parsed Markdown issue, and the unsupported cases', () => {
    const json = readFolderFile('hubspot-activity-2026-10-08.json', JSON.stringify({ producer: 'codex_hubspot_report', records: [{ producer: 'codex_hubspot_report', producerRunId: 'r', producerItemId: '2026-10-08#1', kind: 'engagement', title: 't', text: 'x', reportedOn: '2026-10-08' }] }), { capturedOn: '2026-10-09' });
    expect(json).toMatchObject({ shape: 'json_batch', producer: 'codex_hubspot_report' });
    expect(json.records).toHaveLength(1);
    const withBlock = `${fx('yards-first-2026-10-09.md')}\n\n\`\`\`json\n{"records":[{"producer":"yards_first_brief","producerRunId":"r","producerItemId":"2026-10-09#1","kind":"development","title":"From the block","text":"x","reportedOn":"2026-10-09"}]}\n\`\`\`\n`;
    const block = readFolderFile('yards-first-2026-10-09.md', withBlock, { capturedOn: '2026-10-09' });
    expect(block).toMatchObject({ shape: 'markdown_block', producer: 'yards_first_brief' });
    expect(block.records[0].title).toBe('From the block');
    const parsed = readFolderFile('issue.md', fx('yards-first-2026-10-09.md'), { capturedOn: '2026-10-09' });
    expect(parsed).toMatchObject({ shape: 'markdown_parsed', producer: 'yards_first_brief' });
    expect(parsed.records).toHaveLength(4);
    expect(parsed.records[1].title).toBe('Kodiak reaches Laredo, but not yet Mexico');
    const undated = readFolderFile('signal-desk-2026-10-07.md', fx('signal-desk-undated.md'), { capturedOn: '2026-10-09' });
    expect(undated.records[0].reportedOn).toBe('2026-10-07');
    expect(readFolderFile('notes.md', '# Nothing known\n\nwords', { capturedOn: '2026-10-09' })).toMatchObject({ shape: 'unsupported' });
    expect(readFolderFile('deck.pptx', 'x', { capturedOn: '2026-10-09' })).toMatchObject({ shape: 'unsupported' });
    expect(readFolderFile('bad.json', '{', { capturedOn: '2026-10-09' }).shape).toBe('unsupported');
  });

  it('detectProducer: frontmatter, comment, file name, heading, in that order; the hash is stable', () => {
    expect(detectProducer('x.md', '---\nproducer: freight_x_signal_desk\n---\n# Yards First Daily | x')).toBe('freight_x_signal_desk');
    expect(detectProducer('x.md', '<!-- producer: codex_hubspot_report -->\n# Signal Desk | x')).toBe('codex_hubspot_report');
    expect(detectProducer('signal-desk-2026-10-09.md', '')).toBe('freight_x_signal_desk');
    expect(detectProducer('x.md', '## HubSpot Activity & Engagement — Thu, Oct. 8')).toBe('codex_hubspot_report');
    expect(detectProducer('x.md', 'nothing')).toBeNull();
    expect(recordsBlockOf('no block')).toBeNull();
    expect(fileHash('a')).toBe(fileHash('a'));
    expect(fileHash('a')).not.toBe(fileHash('b'));
  });
});
