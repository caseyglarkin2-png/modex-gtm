import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');
const read = (relativePath: string) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

describe('public demo SEO and GEO', () => {
  it('keeps CollectionPage data in the server-rendered gallery source', () => {
    const page = read('src/app/demo/page.tsx');
    expect(page).toMatch(/'@type': 'CollectionPage'/);
    expect(page).toContain("url: 'https://yardflow.ai/demo/'");
    expect(page).toContain('type="application/ld+json"');
  });

  it('advertises canonical trailing-slash links from the proxied demo shell', () => {
    const chrome = read('src/components/demo/demo-chrome.tsx');
    const hrefs = [...chrome.matchAll(/href:\s*'([^']+)'|href="([^"]+)"/g)]
      .map((match) => match[1] ?? match[2])
      .filter((href) => href.startsWith('/'));

    expect(hrefs.length).toBeGreaterThan(5);
    for (const href of hrefs) {
      const pathname = href.split(/[?#]/, 1)[0];
      expect(pathname.endsWith('/'), href).toBe(true);
    }
  });
});
